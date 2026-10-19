#!/usr/bin/env node
import {Transform} from 'node:stream';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './index.js';
async function main(){
 const args=process.argv.slice(2);if(args[0]==='--help'){console.log('Usage: zof-mcp-server --workspace PATH\nLocal MCP stdio only. Read-only bounded tools; no uploads, shell execution or credentials.');return;}
 if(args[0]==='--version'){console.log('0.1.1');return;}
 if(args.length!==2||args[0]!=='--workspace')throw new Error('WORKSPACE_REQUIRED');
 const server=await createServer(args[1]);let bytes=0;
 const input=new Transform({transform(chunk:Buffer,_encoding,done){for(const b of chunk){bytes++;if(bytes>1048576){done(new Error('REQUEST_LIMIT'));return;}if(b===10)bytes=0;}done(null,chunk);}});
 input.on('error',()=>{console.error('MCP_INPUT_LIMIT: request exceeds the protocol input limit.');void server.close();process.stdin.destroy();process.exitCode=2;});
 process.stdin.pipe(input);const transport=new StdioServerTransport(input,process.stdout);await server.connect(transport);
 const stop=()=>{void server.close();process.stdin.destroy();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
main().catch(()=>{console.error('MCP_START_ERROR: provide a valid, narrowly scoped workspace; use --help.');process.exitCode=2;});
