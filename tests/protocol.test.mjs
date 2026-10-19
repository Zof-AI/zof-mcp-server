import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm,symlink} from 'node:fs/promises';import {join,resolve} from 'node:path';import {tmpdir} from 'node:os';import {spawn} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const cli=resolve('dist/cli.js');
async function session(fn){const root=await mkdtemp(join(tmpdir(),'zof-mcp-'));const transport=new StdioClientTransport({command:process.execPath,args:[cli,'--workspace',root],stderr:'pipe'});const client=new Client({name:'independent-protocol-fixture',version:'1.0.0'});let stderr='';transport.stderr?.on('data',d=>{stderr+=d;});try{await writeFile(join(root,'main.ts'),'export function add(a:number,b:number){return a+b;}\n');await client.connect(transport);await fn({root,client,stderr:()=>stderr});}finally{await client.close();await transport.close();await rm(root,{recursive:true,force:true});}}
test('real official MCP client connects, discovers six schemas and invokes local tools',()=>session(async({client,root,stderr})=>{
 const list=await client.listTools();assert.equal(list.tools.length,6);for(const t of list.tools){assert.equal(t.inputSchema.type,'object');assert.equal(t.outputSchema.type,'object');}
 for(const name of ['zof_get_capabilities','zof_verify_change','zof_analyze_impact','zof_generate_evidence','zof_suggest_tests']){const r=await client.callTool({name,arguments:name==='zof_get_capabilities'?{}:{changedFiles:['main.ts']}});assert.ok(!r.isError,JSON.stringify(r));assert.ok(r.structuredContent.result);}
 const e=await client.callTool({name:'zof_generate_evidence',arguments:{changedFiles:['main.ts']}});await writeFile(join(root,'evidence.json'),JSON.stringify(e.structuredContent.result));await writeFile(join(root,'policy.json'),JSON.stringify({version:'1.0',rules:[{id:'static',type:'deny-severity',severity:'high'}]}));
 const p=await client.callTool({name:'zof_evaluate_policy',arguments:{policyPath:'policy.json',evidencePath:'evidence.json'}});assert.equal(p.structuredContent.result.result,'pass');assert.equal(stderr(),'');
}));
test('schema validation, traversal, hidden files, symlinks and malformed evidence are denied',()=>session(async({client,root})=>{
 await writeFile(join(root,'bad.json'),'synthetic-credential-not-json');await symlink(join(root,'bad.json'),join(root,'link.json'));
 for(const args of [{policyPath:'../outside.json',evidencePath:'bad.json'},{policyPath:'.ssh/key.json',evidencePath:'bad.json'},{policyPath:'link.json',evidencePath:'bad.json'},{policyPath:'bad.json',evidencePath:'bad.json'},{policyPath:42,evidencePath:'bad.json'}]){const r=await client.callTool({name:'zof_evaluate_policy',arguments:args});assert.equal(r.isError,true);assert.ok(!JSON.stringify(r).includes('synthetic-credential-not-json'));}
 const invalid=await client.callTool({name:'zof_verify_change',arguments:{changedFiles:['main.ts'],root:'/tmp'}});assert.equal(invalid.isError,true);
 const marker='SYNTHETIC_SENSITIVE_FIELD_NAME';const keyed=await client.callTool({name:'zof_verify_change',arguments:{changedFiles:['main.ts'],[marker]:'value'}});assert.equal(keyed.isError,true);assert.ok(!JSON.stringify(keyed).includes(marker));
 const unknown=await client.callTool({name:marker,arguments:{}});assert.equal(unknown.isError,true);assert.ok(!JSON.stringify(unknown).includes(marker));
}));
test('unknown tools and oversized argument lists reject without executing anything',()=>session(async({client})=>{
 const unknown=await client.callTool({name:'shell',arguments:{command:'not-executed'}});assert.equal(unknown.isError,true);
 const huge=await client.callTool({name:'zof_verify_change',arguments:{changedFiles:Array(501).fill('main.ts')}});assert.equal(huge.isError,true);
 const controller=new AbortController();controller.abort();await assert.rejects(()=>client.callTool({name:'zof_get_capabilities',arguments:{}},undefined,{signal:controller.signal}));
}));
test('stdio oversized unterminated frame is rejected with a fixed safe error',async()=>{
 const root=await mkdtemp(join(tmpdir(),'zof-mcp-frame-'));try{
  const child=spawn(process.execPath,[cli,'--workspace',root],{stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH}});let stderr='';child.stderr.on('data',d=>{stderr+=d;});child.stdin.on('error',()=>{});child.stdin.end('x'.repeat(1048577));const code=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(new Error('timeout'));},10000);child.once('exit',c=>{clearTimeout(timer);resolve(c);});});assert.equal(code,2);assert.match(stderr,/MCP_INPUT_LIMIT/);assert.ok(stderr.length<200);
 }finally{await rm(root,{recursive:true,force:true});}
});
