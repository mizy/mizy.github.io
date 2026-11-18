// Only list public projects with verified destinations. Add new apps here.
window.PROJECTS = [
 {name:'SimSketch',category:'工具',description:'在画布上为仿真图片添加约束、载荷和文字，支持图层与本地保存。',url:'/sim-sketch/',kind:'WEB APP',icon:'layers',color:'#303864',ink:'#c7cdf8'},
 {name:'3D 查看器',category:'工具',description:'在浏览器里查看本地 3D 文件，支持 STL、OBJ、glTF、3MF 与 STEP。',url:'/mz-3d-viewer/',kind:'WEB APP',icon:'cube',color:'#27352e',ink:'#bed6ad'},
 {name:'3D 打印',category:'创作',description:'从设计到实物，整理正在制作的模型与打印项目。',url:'/mz-3d-print/',kind:'COLLECTION',icon:'layers',color:'#353027',ink:'#d8c7a8'},
 {name:'小药仓',category:'工具',description:'用药记录与药品库存管理，把日常信息整理在一处。',url:'/pillbox/',kind:'WEB APP',icon:'pill',color:'#2f303b',ink:'#bdbbd9'},
 {name:'吉他谱库',category:'创作',description:'收集与浏览吉他谱，给下一次练习找一首歌。',url:'/mz-guitar-tabs-collect/',kind:'COLLECTION',icon:'music',color:'#362b29',ink:'#d6b0a3'},
 {name:'Rally Arena',category:'游戏',description:'打开浏览器，来一场羽毛球单打。',url:'/badminton-web/',kind:'WEB GAME',icon:'racket',color:'#263236',ink:'#acd0d5'}
];
window.ARCHIVE = [
 {name:'MiniGL',description:'WebGL 图形库与示例',url:'/MiniGL/'},
 {name:'miniGPU',description:'WebGPU 图形实验',url:'/miniGPU/'},
 {name:'MMEditor',description:'编辑器项目',url:'/MMEditor/'},
 {name:'OREditor',description:'编辑器项目',url:'/OREditor/'},
 {name:'pigeonGL',description:'图形渲染项目',url:'/pigeonGL/'},
 {name:'re-my-mind',description:'思维导图项目',url:'/re-my-mind/'},
 {name:'react-virtual-table',description:'虚拟表格组件',url:'/react-virtual-table/'},
 {name:'heartdance',description:'Shader 视觉实验',url:'/heartdance/'}
];

// Restored from public repository descriptions and README files, not inferred deployments.
window.SOURCE_PROJECTS = [
{name:'MiniGL',group:'图形渲染',description:'2D WebGL 渲染库，适配 DragonBones 骨骼与网格动画。保留了当时做的视线跟随演示。',repo:'MiniGL',demo:'/MiniGL/',extra:{label:'DragonBones 演示',url:'/MiniGL/demo/dragonBones/eyetrack.html'}},
{name:'miniGPU',group:'图形渲染',description:'基于 WebGPU 的渲染引擎，继续探索浏览器里的图形渲染。',repo:'miniGPU',demo:'/miniGPU/'},
{name:'pigeonGL',group:'地图与可视化',description:'3D 地图渲染项目。',repo:'pigeonGL',demo:'/pigeonGL/'},
{name:'MMEditor',group:'编辑器',description:'基于 SVG 的流程图编辑器。',repo:'MMEditor',demo:'/MMEditor/'},
{name:'OREditor',group:'编辑器',description:'基于 SVG 的富文本编辑器，探索不同于常规 DOM 排版的渲染方式。',repo:'OREditor',demo:'/OREditor/'},
{name:'re-my-mind',group:'编辑器',description:'用于生成和渲染思维导图的 JavaScript 库。',repo:'re-my-mind',demo:'/re-my-mind/'},
{name:'cad-surface-mesher',group:'源码工具',description:'CAD 与网格处理工具集：曲面三角化、水密外壳修复、网格审计和车辆几何相似度分析。',repo:'cad-surface-mesher'},
{name:'fund-analyzer',group:'命令行工具',description:'基金数据分析工具，支持多维评分、批量对比、持仓分析与回测。',repo:'fund-analyzer'},
{name:'dark-isle',group:'游戏引擎',description:'基于 Phaser 3 和 TypeScript 的 2.5D 等距游戏引擎。',repo:'dark-isle'},
{name:'react-virtual-table',group:'组件',description:'支持虚拟加载和表头缩放的表格组件。',repo:'react-virtual-table',demo:'/react-virtual-table/'},
{name:'local-agent-chat',group:'本地应用',description:'基于 Flutter 与 llama.cpp 的本地离线大模型聊天应用。',repo:'local-agent-chat'},
{name:'ant-cron',group:'组件',description:'基于 Ant Design 组件的 Cron 表达式生成器。',repo:'ant-cron'},
{name:'three-mapbox-layer',group:'地图与可视化',description:'让 Three.js 场景接入地图的 Mapbox 自定义图层。',repo:'three-mapbox-layer'},
{name:'heartdance',group:'视觉实验',description:'基于 Three.js 的 Shader 视觉实验。',repo:'heartdance',demo:'/heartdance/'}
];
