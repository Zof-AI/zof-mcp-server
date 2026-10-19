import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {parse,resolve} from 'node:path';
import {homedir} from 'node:os';
import {verify,analyzeImpact,evaluatePolicy,CAPABILITIES} from '@zofai/cli';
import {safeListDirectory,safeReadJson,safeReadFile,redact,assertSafeRelativePath} from '@zofai/evidence-spec';
import {generateTests} from '@zofai/testgen';
import type {Transport} from '@modelcontextprotocol/sdk/shared/transport.js';
import {PrivateErrorsTransport} from './transport.js';
class PrivateErrorsServer extends McpServer { override async connect(transport:Transport){await super.connect(new PrivateErrorsTransport(transport));} }
const path=z.string().min(1).max(1024).refine(s=>{try{assertSafeRelativePath(s);return !s.split('/').some(p=>p.startsWith('.'));}catch{return false;}},'Use a non-hidden workspace-relative file');
const changes=z.object({base:z.string().min(1).max(256).optional(),head:z.string().min(1).max(256).optional(),changedFiles:z.array(path).min(1).max(500).optional()}).strict();
const outputSchema=z.object({result:z.unknown()});
type Result={content:{type:'text';text:string}[];structuredContent:{result:unknown};isError?:boolean};
const response=(value:unknown):Result=>{const result=redact(value);return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:{result}};};
const error=():Result=>({...response({code:'LOCAL_TOOL_ERROR',message:'Input was invalid, unavailable, incomplete, cancelled or outside the approved workspace.'}),isError:true});

/** Read-only capabilities only. Workspace is set by the host, never a tool arg. */
export async function createServer(workspace:string):Promise<McpServer>{
 const root=resolve(workspace);if(root===parse(root).root||root===homedir())throw new Error('WORKSPACE_TOO_BROAD');
 await safeListDirectory(root,'',1);
 const server=new PrivateErrorsServer({name:'zof-mcp-server',version:'0.1.0'},{maxToolInputElements:2000});
 let active=0;
 const bounded=(fn:(args:any,signal:AbortSignal)=>Promise<unknown>)=>async(args:any,extra:any):Promise<Result>=>{
   if(active>=2||extra.signal?.aborted)return error();active++;
   const controller=new AbortController();const onAbort=()=>controller.abort();extra.signal?.addEventListener('abort',onAbort,{once:true});
   const timer=setTimeout(()=>controller.abort(),30000);
   try{const value=await fn(args,controller.signal);if(controller.signal.aborted)return error();const r=response(value);if(Buffer.byteLength(r.content[0].text)>4*1024*1024)return error();return r;}catch{return error();}finally{clearTimeout(timer);extra.signal?.removeEventListener('abort',onAbort);active--;}
 };
 const annotations={readOnlyHint:true,destructiveHint:false,openWorldHint:false};
 server.registerTool('zof_get_capabilities',{description:'Describe local-only capabilities and limits; no authentication required.',inputSchema:z.object({}).strict(),outputSchema,annotations},bounded(async()=>({...CAPABILITIES,maxRequestBytes:1048576,maxConcurrentTools:2,workspaceFixed:true,testExecution:false})));
 server.registerTool('zof_verify_change',{description:'Inspect local changes with bounded static heuristics; never executes source.',inputSchema:changes,outputSchema,annotations},bounded(async(args,signal)=>verify({root,...args,signal})));
 server.registerTool('zof_analyze_impact',{description:'Inspect conventional static import dependencies and affected tests.',inputSchema:changes,outputSchema,annotations},bounded(async(args)=>analyzeImpact({root,...args})));
 server.registerTool('zof_generate_evidence',{description:'Return validated portable static-analysis evidence without uploads.',inputSchema:changes,outputSchema,annotations},bounded(async(args,signal)=>(await verify({root,...args,signal})).evidence));
 server.registerTool('zof_evaluate_policy',{description:'Evaluate finite local policy rules against local evidence files.',inputSchema:z.object({policyPath:path,evidencePath:path,now:z.string().max(64).optional()}).strict(),outputSchema,annotations},bounded(async(args)=>{const [policy,evidence]=await Promise.all([safeReadJson(root,args.policyPath),safeReadJson(root,args.evidencePath)]);return evaluatePolicy(evidence,policy,{now:args.now});}));
 const suggestions=changes.extend({sourcePath:path.optional(),language:z.enum(['typescript','python']).optional(),functions:z.array(z.string().regex(/^[A-Za-z_]\w*$/).max(128)).min(1).max(100).optional(),module:z.string().min(1).max(256).optional()}).strict();
 server.registerTool('zof_suggest_tests',{description:'Suggest boundary cases or generate local reviewable test candidates for selected TypeScript/Python functions; no code executes or is written.',inputSchema:suggestions,outputSchema,annotations},bounded(async(args)=>{
   if(args.sourcePath){if(!args.language||!args.functions||!args.module)throw new Error('GENERATION_INPUT');return generateTests({language:args.language,functions:args.functions,module:args.module,source:(await safeReadFile(root,args.sourcePath,1024*1024)).toString('utf8')});}
   const impact=await analyzeImpact({root,...args});
   return {verified:false,affectedTests:impact.affectedTests,suggestions:impact.changedSymbols.map(s=>({file:s.file,symbol:s.name,cases:['valid representative input','empty and null input where accepted','minimum and maximum boundary','documented bug reproduction']})),limitations:impact.limitations};
 }));
 return server;
}
