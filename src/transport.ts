import type {Transport} from '@modelcontextprotocol/sdk/shared/transport.js';
import type {JSONRPCMessage} from '@modelcontextprotocol/sdk/types.js';
/** Public SDK transport boundary: protocol errors cannot reflect client secrets. */
export class PrivateErrorsTransport implements Transport {
 onmessage?: (message:JSONRPCMessage)=>void;
 onerror?: (error:Error)=>void;
 onclose?: ()=>void;
 constructor(private readonly inner:Transport){}
 get sessionId(){return this.inner.sessionId;}
 async start(){this.inner.onmessage=m=>this.onmessage?.(m);this.inner.onerror=()=>this.onerror?.(new Error('MCP_TRANSPORT_ERROR'));this.inner.onclose=()=>this.onclose?.();await this.inner.start();}
 async close(){await this.inner.close();}
 async send(message:JSONRPCMessage){
  if('error' in message){await this.inner.send({...message,error:{code:message.error.code,message:'MCP_REQUEST_ERROR: request could not be processed safely.'}});return;}
  if('result' in message&&message.result.isError===true){const result={code:'LOCAL_TOOL_ERROR',message:'Input was invalid, unavailable, incomplete, cancelled or outside the approved workspace.'};await this.inner.send({...message,result:{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:{result},isError:true}});return;}
  await this.inner.send(message);
 }
}
