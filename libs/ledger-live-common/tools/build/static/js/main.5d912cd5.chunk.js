(this["webpackJsonplive-common-tools"] = this["webpackJsonplive-common-tools"] || []).push([[0],{

/***/ 28:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "static/media/ledgerlive-logo.9a7d658b.svg";

/***/ }),

/***/ 35:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(64);


/***/ }),

/***/ 40:
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ 64:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react@17.0.2/node_modules/react/index.js
var react = __webpack_require__(0);
var react_default = /*#__PURE__*/__webpack_require__.n(react);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-dom@17.0.2_react@17.0.2/node_modules/react-dom/index.js
var react_dom = __webpack_require__(12);
var react_dom_default = /*#__PURE__*/__webpack_require__.n(react_dom);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-router-dom@5.3.1_react@17.0.2/node_modules/react-router-dom/esm/react-router-dom.js
var react_router_dom = __webpack_require__(20);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-router@5.3.1_react@17.0.2/node_modules/react-router/esm/react-router.js
var react_router = __webpack_require__(4);

// EXTERNAL MODULE: ./src/index.css
var src = __webpack_require__(40);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/@babel+runtime@7.9.0/node_modules/@babel/runtime/helpers/esm/objectSpread2.js + 1 modules
var objectSpread2 = __webpack_require__(32);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/@babel+runtime@7.9.0/node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js + 1 modules
var objectWithoutProperties = __webpack_require__(22);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/invariant@2.2.4/node_modules/invariant/browser.js
var browser = __webpack_require__(18);
var browser_default = /*#__PURE__*/__webpack_require__.n(browser);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-inspector@4.0.1_react@17.0.2/node_modules/react-inspector/dist/es/react-inspector.js
var react_inspector = __webpack_require__(16);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-table@6.11.5_oxfzelaz5ynxsop2v2nu2h2m64/node_modules/react-table/es/index.js + 6 modules
var es = __webpack_require__(31);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/styled-components@4.4.1_sfoxds7t5ydpegc3knd667wn6m/node_modules/styled-components/dist/styled-components.browser.esm.js
var styled_components_browser_esm = __webpack_require__(8);

// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-table@6.11.5_oxfzelaz5ynxsop2v2nu2h2m64/node_modules/react-table/react-table.css
var react_table = __webpack_require__(46);

// CONCATENATED MODULE: ./src/demos/logsviewer/index.js
const _excluded=["type","level","pname","message","timestamp","index"],_excluded2=["type","level","pname","message","timestamp","index"];function decodeAccountId(accountId){browser_default()(typeof accountId==="string","accountId is not a string");const splitted=accountId.split(":");browser_default()(splitted.length===5,"invalid size for accountId");const[type,version,currencyId,xpubOrAddress,derivationMode]=splitted;return{type,version,currencyId,xpubOrAddress,derivationMode};}const shortAddressPreview=(addr,target=20)=>{const slice=Math.floor((target-3)/2);return addr.length<target-3?addr:`${addr.slice(0,slice)}...${addr.slice(addr.length-slice)}`;};const messageLenses={libcore:({message})=>{const i=message.indexOf("I: ");return i===-1?message:message.slice(i+3);}};const Button=styled_components_browser_esm["a" /* default */].a`
  cursor: pointer;
  padding: 12px 16px;
  border: none;
  background: ${p=>p.danger?"#FF483820":p.primary?"#6490F1":"rgba(100, 144, 241, 0.1)"};
  color: ${p=>p.danger?"#FF4838":p.primary?"#fff":"#6490F1"};
  border-radius: 4px;
  opacity: ${p=>p.disabled?0.3:1};
  &:hover {
    opacity: ${p=>p.disabled?0.3:0.8};
  }
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  > svg {
    padding-right: 5px;
  }
`;const HeaderWrapper=styled_components_browser_esm["a" /* default */].div``;const HeaderRow=styled_components_browser_esm["a" /* default */].div`
  display: flex;
  padding: 10px;
  > * + * {
    margin-right: 10px;
  }
`;const Header=({logs,logsMeta,onFiles})=>{const apdusLogs=Object(react["useMemo"])(()=>logs.slice(0).reverse().filter(l=>l.type==="apdu").reduce((all,l)=>{const last=all[all.length-1];if(last&&last.message===l.message)return all;return all.concat(l);},[]),[logs]);const txSummaryLogs=Object(react["useMemo"])(()=>logs.slice(0).reverse().filter(l=>l.type==="transaction-summary"),[logs]);const apdus=apdusLogs.map(l=>l.message).join("\n");const experimentalEnvs=Object(react["useMemo"])(()=>logsMeta?Object.keys(logsMeta.env).map(key=>{if(key.includes("EXPERIMENTAL")){return{key,value:logsMeta.env[key]};}return null;}).filter(env=>!!env&&!!env.value):[],[logsMeta]);const href=Object(react["useMemo"])(()=>"data:text/plain;base64,"+btoa(apdus),[apdus]);const onChange=e=>onFiles(e.target.files);const errors=logs.filter(l=>l.error);const accountsIds=logsMeta===null||logsMeta===void 0?void 0:logsMeta.accountsIds;let accounts;try{accounts=accountsIds.map(id=>{const{derivationMode,xpubOrAddress,currencyId}=decodeAccountId(id);const index=0;const freshAddressPath="0'/0'/0'/0/0";// NB this is intentionally wrong. you are not in possession of this account.
return{data:{id,seedIdentifier:xpubOrAddress,xpub:xpubOrAddress,derivationMode,index,freshAddress:xpubOrAddress,freshAddressPath,freshAddresses:[],name:currencyId+" "+shortAddressPreview(xpubOrAddress),starred:true,balance:"0",blockHeight:0,currencyId,operations:[],pendingOperations:[],swapHistory:[],unitMagnitude:0,lastSyncDate:"0"}};}).filter(Boolean);}catch(e){console.error(e);}const appJsonHref=Object(react["useMemo"])(()=>{try{return!accounts?"":"data:text/plain;base64,"+btoa(JSON.stringify({data:{settings:{hasCompletedOnboarding:true},user:{id:"_"},accounts}}));}catch(e){console.error(e);}},[accounts]);return/*#__PURE__*/react_default.a.createElement(HeaderWrapper,null,/*#__PURE__*/react_default.a.createElement(HeaderRow,null,/*#__PURE__*/react_default.a.createElement("input",{type:"file",onChange:onChange,accept:".json"}),apdusLogs.length?/*#__PURE__*/react_default.a.createElement(Button,{download:"apdus",href:href},apdusLogs.length," APDUs"):null,/*#__PURE__*/react_default.a.createElement(Button,{download:"app.json",href:appJsonHref},"app.json with user accounts")),logsMeta?/*#__PURE__*/react_default.a.createElement(HeaderRow,null,/*#__PURE__*/react_default.a.createElement("strong",null,"user is on")," ",logsMeta.userAgent):null,accountsIds?/*#__PURE__*/react_default.a.createElement(HeaderRow,null,/*#__PURE__*/react_default.a.createElement("details",null,/*#__PURE__*/react_default.a.createElement("summary",null,/*#__PURE__*/react_default.a.createElement("strong",null,"user have ",accountsIds.length," accounts")),/*#__PURE__*/react_default.a.createElement("ul",null,accountsIds.map((id,i)=>/*#__PURE__*/react_default.a.createElement("li",{key:i},/*#__PURE__*/react_default.a.createElement("pre",null,/*#__PURE__*/react_default.a.createElement("code",null,id))))))):null,/*#__PURE__*/react_default.a.createElement(HeaderRow,null,/*#__PURE__*/react_default.a.createElement("details",null,/*#__PURE__*/react_default.a.createElement("summary",null,/*#__PURE__*/react_default.a.createElement("strong",null,"this logs have ",errors.length," errors")),/*#__PURE__*/react_default.a.createElement("ul",null,errors.map((e,i)=>/*#__PURE__*/react_default.a.createElement("li",{key:i},/*#__PURE__*/react_default.a.createElement(react_inspector["a" /* ObjectInspector */],{data:e.error,expandLevel:3})))))),txSummaryLogs.length===0?null:/*#__PURE__*/react_default.a.createElement(HeaderRow,null,/*#__PURE__*/react_default.a.createElement("details",null,/*#__PURE__*/react_default.a.createElement("summary",null,/*#__PURE__*/react_default.a.createElement("strong",null,txSummaryLogs.length," transaction events")),/*#__PURE__*/react_default.a.createElement("ul",null,txSummaryLogs.map((_ref,i)=>{let{type,level,pname,message,timestamp,index:_index}=_ref,rest=Object(objectWithoutProperties["a" /* default */])(_ref,_excluded);return/*#__PURE__*/react_default.a.createElement("li",{key:i},/*#__PURE__*/react_default.a.createElement("pre",null,message),Object.keys(rest).length>0?/*#__PURE__*/react_default.a.createElement(react_inspector["a" /* ObjectInspector */],{data:rest}):null);})))),experimentalEnvs.length?/*#__PURE__*/react_default.a.createElement(HeaderRow,null,/*#__PURE__*/react_default.a.createElement("details",null,/*#__PURE__*/react_default.a.createElement("summary",null,/*#__PURE__*/react_default.a.createElement("strong",null,"experimental envs (",experimentalEnvs.length,")")),/*#__PURE__*/react_default.a.createElement("ul",null,experimentalEnvs.map((env,i)=>/*#__PURE__*/react_default.a.createElement("li",{key:i},/*#__PURE__*/react_default.a.createElement("pre",null,/*#__PURE__*/react_default.a.createElement("code",null,`${env.key}: ${env.value}`))))))):null);};const ContentCell=props=>{const log=props.original;const{type,level,pname,message:_msg,timestamp,index:_index}=log,rest=Object(objectWithoutProperties["a" /* default */])(log,_excluded2);// eslint-disable-line no-unused-vars
const messageLense=messageLenses[type];const message=messageLense?messageLense(log):log.message;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement("code",null,message),Object.keys(rest).length>0?/*#__PURE__*/react_default.a.createElement(react_inspector["a" /* ObjectInspector */],{data:rest}):null);};const columns=[{id:"index",Header:"index",accessor:"index",minWidth:80,maxWidth:80},{id:"time",Header:"time",accessor:"timestamp",maxWidth:220},{Header:"process",accessor:"pname",maxWidth:100},{Header:"type",accessor:"type",maxWidth:150},{id:"content",Header:"Content",accessor:"message",Cell:ContentCell}];/*
const getTrProps = (state, p) => {
  if (!p) return;
  const { original } = p;
  return {
    style: {
      opacity: original.level === "debug" ? 0.7 : 1,
      color:
        original.level === "error"
          ? "#C00"
          : original.level === "warn"
            ? "#F90"
            : "#000"
    }
  };
};
*/class logsviewer_Logs extends react["Component"]{render(){const{logs}=this.props;return/*#__PURE__*/react_default.a.createElement(es["a" /* default */],{defaultPageSize:logs.length,filterable:true,data:logs,columns:columns});}}class logsviewer_HeaderEmptyState extends react["Component"]{constructor(...args){super(...args);this.onChange=e=>{this.props.onFiles(e.target.files);};}render(){return/*#__PURE__*/react_default.a.createElement("header",{style:{padding:20}},/*#__PURE__*/react_default.a.createElement("h1",null,"Welcome to"," ",/*#__PURE__*/react_default.a.createElement("span",null,"Ledger ",/*#__PURE__*/react_default.a.createElement("strong",null,"Live"))," ","LogsViewer"),/*#__PURE__*/react_default.a.createElement("p",null,"Select a ",/*#__PURE__*/react_default.a.createElement("code",null,"*.json")," log exported from Ledger Live (",/*#__PURE__*/react_default.a.createElement("code",null,"Ctrl+E")," / Export Logs)"),/*#__PURE__*/react_default.a.createElement("p",null,/*#__PURE__*/react_default.a.createElement("input",{type:"file",onChange:this.onChange,accept:".json"})));}}class logsviewer_LogsViewer extends react["Component"]{constructor(...args){super(...args);this.state={logs:null};this.onDragOver=evt=>{evt.stopPropagation();evt.preventDefault();evt.dataTransfer.dropEffect="copy";};this.onDrop=evt=>{evt.stopPropagation();evt.preventDefault();this.onFiles(evt.dataTransfer.files);};this.onFiles=files=>{for(var i=0,f;f=files[i];i++){if(!f.type.match("application/json")){continue;}var reader=new FileReader();reader.onload=e=>{const txt=e.target.result;let obj;try{obj=JSON.parse(txt);}catch(e){obj=txt.split(/\n/g).filter(Boolean).map(str=>JSON.parse(str));}const logs=obj.map((l,index)=>Object(objectSpread2["a" /* default */])({index},l));console.log({logs});// eslint-disable-line no-console
this.setState({logs});};reader.readAsText(f);}};}render(){const{logs}=this.state;return/*#__PURE__*/react_default.a.createElement("div",{style:{minHeight:"100vh"},onDragOver:this.onDragOver,onDrop:this.onDrop},!logs?/*#__PURE__*/react_default.a.createElement(logsviewer_HeaderEmptyState,{onFiles:this.onFiles}):/*#__PURE__*/react_default.a.createElement(react_default.a.Fragment,null,/*#__PURE__*/react_default.a.createElement(Header,{onFiles:this.onFiles,logs:logs,logsMeta:logs.find(l=>l.message==="exportLogsMeta")}),/*#__PURE__*/react_default.a.createElement(logsviewer_Logs,{logs:logs})));}}// $FlowFixMe
logsviewer_LogsViewer.demo={title:"Logs viewer",url:"/logsviewer"};/* harmony default export */ var logsviewer = (logsviewer_LogsViewer);
// EXTERNAL MODULE: /Users/marco-figment/Projects/Osmosis/ledger-live/node_modules/.pnpm/react-select@5.3.2_sfoxds7t5ydpegc3knd667wn6m/node_modules/react-select/dist/react-select.esm.js + 31 modules
var react_select_esm = __webpack_require__(30);

// EXTERNAL MODULE: ./src/ledgerlive-logo.svg
var ledgerlive_logo = __webpack_require__(28);
var ledgerlive_logo_default = /*#__PURE__*/__webpack_require__.n(ledgerlive_logo);

// CONCATENATED MODULE: ./src/demos/lld-signature/index.js
const Main=styled_components_browser_esm["a" /* default */].div`
  padding-bottom: 100px;
  margin: 20px auto;
  max-width: 600px;

  h1 {
    font-size: 1.6em;
    img {
      vertical-align: middle;
    }
  }

  h2 {
    font-size: 1.4em;
    margin-top: 2em;
  }
`;const Field=styled_components_browser_esm["a" /* default */].div`
  margin-bottom: 20px;
`;const FieldHeader=styled_components_browser_esm["a" /* default */].div`
  display: flex;
  flex-direction: row;
`;const Label=styled_components_browser_esm["a" /* default */].label`
  flex: 1;
  color: #999;
  padding: 0.2em 0;
`;const Textarea=styled_components_browser_esm["a" /* default */].textarea`
  width: 100%;
  box-sizing: border-box;
`;const Block=styled_components_browser_esm["a" /* default */].div`
  color: #888;
  padding: 8px 0;
  margin-bottom: 1em;
  font-family: serif;
  font-size: 1.2em;
  line-height: 1.4em;
`;const BlockCode=styled_components_browser_esm["a" /* default */].pre`
  background-color: #555;
  color: #ddd;
  padding: 10px 20px;
  white-space: pre-wrap;
  word-break: break-word;
`;const ledgerlivepem=`-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEN7qcsG6bogi1nkD3jnMWS813wWguYEcI
CRcijSvFskSFjHB5la4xUt+Omb2t6iUwop+JRy+EUhy0UQ9p/cPsQA==
-----END PUBLIC KEY-----
`;const Download=({name,href})=>{return/*#__PURE__*/react_default.a.createElement("a",{style:{color:"#000",textDecoration:"underline"},download:name,href:href},name);};const LiveDownloadOptions=({release})=>{return/*#__PURE__*/react_default.a.createElement("ul",null,release.assets.filter(a=>[".AppImage","mac.dmg",".exe"].some(s=>a.name.endsWith(s))).map(a=>/*#__PURE__*/react_default.a.createElement("li",null,/*#__PURE__*/react_default.a.createElement(Download,{name:a.name,href:a.browser_download_url}))));};const LLDSignature=()=>{const[releases,setReleases]=Object(react["useState"])(null);const[release,selectRelease]=Object(react["useState"])(null);const[checksums,setChecksums]=Object(react["useState"])(null);const[checksumsSig,setChecksumsSig]=Object(react["useState"])(null);const[checksumsFetchError,setChecksumsFetchError]=Object(react["useState"])(null);const version=release&&release.tag_name.slice(1);const checksumsFilename=version&&`ledger-live-desktop-${version}.sha512sum`;const checksumsUrl=checksumsFilename&&`https://resources.live.ledger.app/public_resources/signatures/${checksumsFilename}`;Object(react["useEffect"])(()=>{let gone;fetch("https://api.github.com/repos/LedgerHQ/ledger-live-desktop/releases").then(r=>r.json()).then(releases=>{if(gone)return;setReleases(releases.filter(r=>r.tag_name.startsWith("v")));});return()=>{gone=true;};},[]);Object(react["useEffect"])(()=>{if(!releases)return;selectRelease(releases.find(r=>!r.prerelease));},[releases]);Object(react["useEffect"])(()=>{let gone;if(!checksumsUrl)return;setChecksumsFetchError(null);setChecksums(null);setChecksumsSig(null);const throwOnErrorPayload=r=>{if(r.status>=400){throw new Error("The checksums didn't exist on that version.");}return r;};Promise.all([fetch(checksumsUrl).then(throwOnErrorPayload).then(r=>r.text()),fetch(checksumsUrl+".sig").then(throwOnErrorPayload).then(r=>r.blob())]).then(([checksums,checksumsSig])=>{if(gone)return;setChecksums(checksums);setChecksumsSig(URL.createObjectURL(checksumsSig));}).catch(e=>{if(gone)return;setChecksumsFetchError(e);});return()=>{gone=true;};},[checksumsUrl]);return/*#__PURE__*/react_default.a.createElement(Main,null,/*#__PURE__*/react_default.a.createElement("h1",null,/*#__PURE__*/react_default.a.createElement("img",{alt:"",src:ledgerlive_logo_default.a,height:"32"})," Ledger Live releases"),/*#__PURE__*/react_default.a.createElement(Field,null,/*#__PURE__*/react_default.a.createElement(FieldHeader,null,/*#__PURE__*/react_default.a.createElement(Label,{for:"release"},"Ledger Live release")),/*#__PURE__*/react_default.a.createElement(react_select_esm["a" /* default */],{id:"release",value:release,options:releases,onChange:selectRelease,placeholder:"Ledger Live Release",getOptionLabel:r=>`${r.tag_name}`,getOptionValue:r=>r.tag_name}),release?/*#__PURE__*/react_default.a.createElement(LiveDownloadOptions,{release:release}):null),/*#__PURE__*/react_default.a.createElement("h2",null,"Verify my Ledger Live install binary"),/*#__PURE__*/react_default.a.createElement(Block,null,"You can verify the authenticity of the Ledger Live binary installation file by comparing its ",/*#__PURE__*/react_default.a.createElement("strong",null,"sha512")," hash to the one available in this file:"),checksums?/*#__PURE__*/react_default.a.createElement(react_default.a.Fragment,null,/*#__PURE__*/react_default.a.createElement(Field,null,/*#__PURE__*/react_default.a.createElement(FieldHeader,null,/*#__PURE__*/react_default.a.createElement(Label,{for:"checksums"},"sha512sum hashes"),/*#__PURE__*/react_default.a.createElement(Download,{href:`data:text/plain;base64,${btoa(checksums)}`,name:checksumsFilename})),/*#__PURE__*/react_default.a.createElement(Textarea,{id:"checksums",style:{minHeight:100},value:checksums})),/*#__PURE__*/react_default.a.createElement(BlockCode,null,checksums.split("\n").filter(Boolean).map(line=>{const[hash,filename]=line.split(/\s+/);const cmd=filename.endsWith(".AppImage")?`sha512sum ${filename}`:filename.endsWith(".exe")?`Get-FileHash ${filename} -Algorithm SHA512`:`shasum -a 512 ${filename}`;return`$ ${cmd}\n${hash}\n`;}).join("\n"))):checksumsFetchError?/*#__PURE__*/react_default.a.createElement("p",null,"Couldn't load the hashes: ",checksumsFetchError.message):/*#__PURE__*/react_default.a.createElement("p",null,"Loading..."),checksums&&checksumsFilename&&checksumsSig&&!checksumsFetchError?/*#__PURE__*/react_default.a.createElement(react_default.a.Fragment,null,/*#__PURE__*/react_default.a.createElement("h2",null,"Verify the sha512sum hashes"),/*#__PURE__*/react_default.a.createElement(Block,null,"For extra security, you should also check that the sha512 hashes published in the file ",/*#__PURE__*/react_default.a.createElement("code",null,checksumsFilename)," are indeed signed by Ledger. A multi-signature setup is used internally using Ledger Nano S devices to mitigate a malicious insider attack."),/*#__PURE__*/react_default.a.createElement(Field,null,/*#__PURE__*/react_default.a.createElement(FieldHeader,null,/*#__PURE__*/react_default.a.createElement(Label,null,"This is Ledger Live's OpenSSL public key (ECDSA)"),/*#__PURE__*/react_default.a.createElement(Download,{href:`data:application/x-pem-file;base64,${btoa(ledgerlivepem)}`,name:"ledgerlive.pem"})),/*#__PURE__*/react_default.a.createElement(Textarea,{style:{height:80}},ledgerlivepem),/*#__PURE__*/react_default.a.createElement("a",{target:"_blank",rel:"noopener noreferrer",href:"https://github.com/LedgerHQ/ledger-live-desktop/blob/master/src/main/updater/ledger-pubkey.js"},"as embedded in Ledger Live source code")),/*#__PURE__*/react_default.a.createElement(Field,null,/*#__PURE__*/react_default.a.createElement(FieldHeader,null,/*#__PURE__*/react_default.a.createElement(Label,null,"Signature of sha512sum hashes file:")),/*#__PURE__*/react_default.a.createElement(Download,{href:checksumsSig,name:checksumsFilename+".sig"})),/*#__PURE__*/react_default.a.createElement(BlockCode,null,`$ openssl dgst -sha256 -verify ledgerlive.pem -signature ${checksumsFilename}.sig ${checksumsFilename}

Verified OK`),/*#__PURE__*/react_default.a.createElement("h2",null,"What about automatic updates"),/*#__PURE__*/react_default.a.createElement(Block,null,"The update mechanism is secured once you've verified and installed Ledger Live. Ledger Live checks each upcoming update against Ledger's public key to verify that the update is legitimately from Ledger.")):null);};// $FlowFixMe
LLDSignature.demo={title:"Ledger Live Desktop signatures",url:"/lld-signatures"};/* harmony default export */ var lld_signature = (LLDSignature);
// CONCATENATED MODULE: ./src/demos/index.js
/* harmony default export */ var demos = ({LogsViewer: logsviewer,lldSignature: lld_signature});
// CONCATENATED MODULE: ./src/index.js
class src_Dashboard extends react["Component"]{render(){return/*#__PURE__*/react_default.a.createElement("div",{style:{width:600,margin:"40px auto"}},/*#__PURE__*/react_default.a.createElement("h1",null,"Ledger Live Tools"),Object.keys(demos).filter(key=>!demos[key].demo.hidden).map(key=>{const Demo=demos[key];const{url,title}=Demo.demo;return/*#__PURE__*/react_default.a.createElement(react_router_dom["b" /* Link */],{key:key,to:url,style:{display:"block",padding:"0.8em 0",fontSize:"1.6em"}},title);}));}}const App=()=>{if(window.location.host==="ledger-live-tools.netlify.com"){return/*#__PURE__*/react_default.a.createElement("h1",null,"The tools has moved to: ",window.location.href.replace("ledger-live-tools.netlify.com","ledger-live-tools.now.sh"));}return/*#__PURE__*/react_default.a.createElement(react_router["c" /* Switch */],null,/*#__PURE__*/react_default.a.createElement(react_router["a" /* Route */],{exact:true,path:"/",component:src_Dashboard}),Object.keys(demos).map(key=>{const Demo=demos[key];const{url}=Demo.demo;return/*#__PURE__*/react_default.a.createElement(react_router["a" /* Route */],{key:key,path:url,component:Demo});}));};react_dom_default.a.render(/*#__PURE__*/react_default.a.createElement(react_router_dom["a" /* BrowserRouter */],null,/*#__PURE__*/react_default.a.createElement(App,null)),document.getElementById("root"));// registerServiceWorker();

/***/ })

},[[35,1,2]]]);
//# sourceMappingURL=main.5d912cd5.chunk.js.map