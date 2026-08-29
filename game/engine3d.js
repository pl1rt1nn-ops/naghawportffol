"use strict";
/* МАЯК МОЛЧАНИЯ — полноценная 3D-версия без мультиплеера.
   Перенесены комнаты, предметы, записи, крафт, здоровье/рассудок,
   батарейки, фонарь, монстр, несколько концовок, секрет "обнова",
   мобильное управление и текстуры из 2D assets. */
const COLS=20, ROWS=15, TILE=2, WALL_H=3;
const A='assets/';
const INTRO={
  caught:'Фонарь гаснет в твоей руке за миг до того, как что-то холодное касается плеча.\nПоследнее, что ты слышишь — собственное дыхание, оборвавшееся на середине.',
  sanity:'Рассудок не выдерживает тишины и того, что в ней прячется.\nТы больше не можешь отличить шаги на лестнице от ударов собственного сердца.',
  exhausted:'Каждое его прикосновение забирало часть тебя.\nНоги подкашиваются, и в темноте становится совсем тихо.'
};
const JOURNAL=[
 ['СТРАНИЦА 1','12 марта.\nСвет в проливе снова гас сам по себе. Механизм исправен, я проверял его трижды. Дело не в лампе.\nЯ слышу шаги на лестнице, когда наверху никого нет.'],
 ['СТРАНИЦА 2','27 марта.\nОно боится света, но не уходит — только пятится в тень и ждёт, когда фонарь потухнет.\nЯ начал экономить масло. Экономить свет — значит впустить его ближе.'],
 ['СТРАНИЦА 3','3 апреля. Последняя запись в жилой части.\nЕсли ты читаешь это — не гаси фонарь надолго. Найди топливо в кладовой, ключ где-то у лестницы.\nНо есть ещё архив. Я спрятал там записи, которые не должен был читать никто.'],
 ['СТРАНИЦА 4','7 апреля. Архив.\nЯ понял: свет не уничтожает его. Свет показывает, где оно было. Поэтому оно боится не лампы — оно боится, что его увидят.\nНа крыше есть старый аварийный прожектор. Если включить его после маяка, можно закрыть цикл.'],
 ['СТРАНИЦА 5','8 апреля.\nЕсли я не вернусь, не верь голосу из подвала. Оно умеет повторять чужие слова.\nЗажги маяк, подними аварийный прожектор и не оборачивайся. Тогда рассвет будет настоящим.\n— Освальд']
];
const ENDINGS={
 escape:['ПОБЕГ','ТЫ УСПЕЛ','Маяк снова работает. Ты не знаешь, что именно жило в темноте, и не хочешь знать.\nТы уходишь до рассвета, оставляя башню позади.'],
 lastlight:['ПОСЛЕДНИЙ СВЕТ','ТЫ ДОШЁЛ НА ПРЕДЕЛЕ','Лампа загорается, когда сил почти не осталось.\nТы успеваешь увидеть, как тень отступает, но сам едва остаёшься на ногах.\nНа рассвете тебя находят у окна фонарной комнаты.'],
 true:['ИСТИННЫЙ СВЕТ','ИСТИННАЯ КОНЦОВКА','Ты собрал все записи Освальда и понял, что произошло.\nАварийный прожектор на крыше вспыхивает вслед за маяком.\nТень не просто исчезает — вместе с ней исчезает странное эхо шагов во всей башне.\nКогда приходит рассвет, маяк впервые за много лет молчит по-настоящему.'],
 secret:['ОБНОВА','СЕКРЕТНАЯ КОНЦОВКА','Ты нашёл комнату, которой не было на карте.\nНа стене только одна надпись: «Ты всё равно дошёл».\nДверь за спиной закрывается сама.\nГде-то далеко снова включается маяк.']
};
function walls(extra=[]){const w=[];for(let y=0;y<ROWS;y++){w[y]=[];for(let x=0;x<COLS;x++)w[y][x]=x===0||y===0||x===COLS-1||y===ROWS-1;}extra.forEach(([x,y])=>w[y][x]=true);return w;}
const rooms={
 entrance:{name:'Вход',walls:walls([[5,5],[5,6],[5,7],[14,9],[14,10],[14,11]]),doors:[{x:19,y:7,w:1,h:2,target:'storage',sx:1,sy:7}],items:[{id:'j1',x:3,y:3,type:'journal',page:0},{id:'bat1',x:16,y:12,type:'battery'},{id:'scrap1',x:8,y:10,type:'scrap'},{id:'scrap2',x:17,y:4,type:'scrap'},{id:'cloth1',x:10,y:3,type:'cloth'},{id:'wood1',x:4,y:11,type:'wood'}],monster:false},
 storage:{name:'Кладовая',walls:walls([[8,3],[8,4],[8,5],[12,9],[12,10],[3,9],[3,10],[3,11]]),doors:[{x:0,y:7,w:1,h:2,target:'entrance',sx:18,sy:7},{x:9,y:0,w:2,h:1,target:'stairs',sx:9,sy:13},{x:19,y:4,w:1,h:2,target:'basement',sx:2,sy:3,requires:'fuel'}],items:[{id:'fuel',x:15,y:11,type:'fuel'},{id:'j2',x:5,y:12,type:'journal',page:1},{id:'bat2',x:17,y:3,type:'battery'},{id:'scrap3',x:10,y:7,type:'scrap'},{id:'cloth2',x:14,y:5,type:'cloth'},{id:'cloth3',x:6,y:4,type:'cloth'}],monster:true},
 stairs:{name:'Лестница',walls:walls([[6,6],[7,6],[8,6],[13,6],[13,7],[13,8]]),doors:[{x:9,y:14,w:2,h:1,target:'storage',sx:9,sy:1},{x:9,y:0,w:2,h:1,target:'lantern',sx:9,sy:13,requires:'key'},{x:0,y:9,w:1,h:2,target:'archive',sx:17,sy:5,requires:'key'}],items:[{id:'key',x:4,y:4,type:'key'},{id:'j3',x:16,y:11,type:'journal',page:2},{id:'scrap4',x:11,y:10,type:'scrap'},{id:'wood2',x:16,y:4,type:'wood'}],monster:true},
 lantern:{name:'Фонарная комната',walls:walls([[9,9]]),doors:[{x:9,y:14,w:2,h:1,target:'stairs',sx:9,sy:1},{x:19,y:6,w:1,h:2,target:'roof',sx:2,sy:7,requires:'journals'}],items:[],interact:[{x:10,y:5,type:'lantern'}],monster:true},
 archive:{name:'Архив',walls:walls([[5,2],[5,3],[5,4],[5,8],[5,9],[10,2],[10,3],[10,4],[10,8],[10,9],[14,4],[14,5],[14,6]]),doors:[{x:0,y:5,w:1,h:2,target:'stairs',sx:2,sy:5,requires:'key'},{x:19,y:10,w:1,h:2,target:'basement',sx:2,sy:2,requires:'archive'}],items:[{id:'j4',x:16,y:5,type:'journal',page:3},{id:'scrap5',x:8,y:6,type:'scrap'},{id:'cloth4',x:12,y:10,type:'cloth'},{id:'wood3',x:16,y:11,type:'wood'},{id:'pistol1',x:17,y:7,type:'pistol'},{id:'bullets1',x:12,y:2,type:'bullets'}],monster:true},
 basement:{name:'Подвал',walls:walls([[4,2],[4,3],[4,4],[4,9],[4,10],[9,2],[9,3],[9,4],[9,10],[9,11],[14,5],[14,6],[14,7],[17,2],[17,3]]),doors:[{x:0,y:2,w:1,h:2,target:'storage',sx:17,sy:3,requires:'fuel'},{x:19,y:10,w:1,h:2,target:'archive',sx:17,sy:10,requires:'archive'}],items:[{id:'j5',x:11,y:7,type:'journal',page:4},{id:'fuel2',x:16,y:11,type:'fuel'},{id:'scrap6',x:7,y:7,type:'scrap'},{id:'cloth5',x:12,y:3,type:'cloth'},{id:'wood4',x:3,y:12,type:'wood'},{id:'bullets2',x:6,y:12,type:'bullets'}],monster:true},
 roof:{name:'Крыша',walls:walls([[5,2],[5,3],[5,6],[5,7],[9,2],[9,3],[9,6],[9,7],[12,4],[12,5]]),doors:[{x:0,y:7,w:1,h:2,target:'lantern',sx:17,sy:7,requires:'journals'},{x:19,y:1,w:1,h:2,target:'ENDING',sx:18,sy:2}],items:[{id:'roofScrap',x:8,y:5,type:'scrap'},{id:'roofCloth',x:13,y:8,type:'cloth'}],interact:[{x:15,y:4,type:'roofLight'}],monster:true},
 secret:{name:'???',walls:walls(),doors:[{x:9,y:1,w:2,h:1,target:'ENDING',sx:9,sy:2}],items:[],monster:false}
};
const itemInfo={journal:['Запись Освальда','item_journal.png'],battery:['Батарейка','item_battery.png'],scrap:['Металлолом','material_scrap.png'],cloth:['Ткань','material_cloth.png'],wood:['Дерево','material_wood.png'],fuel:['Топливо','item_fuel.png'],key:['Старый ключ','item_key.png'],shiv:['Заточка','weapon_shiv.png'],bandage:['Бинт','material_cloth.png'],flare:['Ракета','lantern_on.png'],pistol:['Пистолет','CANVAS:pistol'],bullets:['Патроны','CANVAS:bullets']};
const recipes=[
 {id:'shiv',name:'Заточка',desc:'Существо отступает от удара и на время перестаёт охотиться.',cost:{scrap:2,wood:1}},
 {id:'bandage',name:'Бинт',desc:'Восстанавливает 35 здоровья.',cost:{cloth:2}},
 {id:'flare',name:'Ракета',desc:'Яркий всполох. Временно отпугивает существо.',cost:{scrap:1,cloth:1,wood:1}}
];
const CHANGELOG=[
 ['1.8','В игру добавлен пистолет — найти его можно в архиве, патроны к нему разбросаны в архиве и подвале. Стрельба (клавиша G) по существу — сюжетный твист: пуля проходит сквозь него без всякого эффекта, оружие против Него попросту бесполезно. При этом каждый выстрел по-прежнему создаёт очень громкий звук — существо услышит его из любой точки комнаты и пойдёт проверять, а первая встреча с этой правдой ощутимо бьёт по рассудку. Никакого нового урона монстру, никакого прогресса силой — только риск и разочарование, как и задумано для этого жанра.'],
 ['1.7','Меню стало заметно детальнее: звёздное небо с мерцанием, луна с мягким сиянием, блики лунного света на воде, пена у берега с лёгким покачиванием. Маяк получил освещённые окна и перила на смотровой площадке, а у подножия — вразнобой раскиданные камни. Дождь теперь выглядит как настоящие капли-полосы, а не кубики. На столе появились ключ, чернильница и перо, а страницы журнала — с текстурой старой линованной бумаги. Добавлено лёгкое покачивание камеры и киношная виньетка по краям экрана. Все новые детали настроены под текущее качество графики и пересобираются сразу при смене настройки, без перезагрузки.'],
 ['1.6','Кнопка Telegram в углу главного меню теперь ведёт на https://t.me/NaghWCH (открывается в новой вкладке).'],
 ['1.5','Главное меню полностью переделано в 3D-сцену: ночной берег, море с анимированными волнами, дождь, туман, маяк с медленно вращающимся лучом света. Рядом стол с керосиновой лампой и журналом. «Новая игра» и «Продолжить» открывают журнал перед стартом. «Настройки» включает радиоприёмник с треском статики. «Выход» гасит лампу — экран гаснет, но всегда можно вернуться. Появился прогресс между сессиями: игра автосохраняется на паузе и при выходе в меню, кнопка «Продолжить» появляется только если есть сохранение и исчезает после гибели или победы.'],
 ['1.4','Новые механики: система шума — бег, ходьба и открытие дверей теперь реально создают шум, и существо идёт проверять его источник, а не всегда знает, где ты. Существо ведёт себя иначе в зависимости от ситуации: гонится напрямую только вблизи, иначе идёт на звук или бесцельно бродит. Рассудок теперь влияет на восприятие по уровням: лёгкие визуальные искажения, ложные шаги и звуки, обманчивый вид дверей, а на критическом уровне на несколько секунд путается управление.'],
 ['1.3','Добавлены настройки графики (Высокая / Средняя / Низкая) и этот список изменений. Игра стала заметно быстрее: стены комнаты теперь рисуются одним вызовом отрисовки вместо десятков, материалы и текстуры переиспользуются вместо пересоздания при каждом переходе между комнатами (это устраняло утечку памяти и постепенное падение FPS), а тени и количество пылинок в воздухе теперь можно снизить на слабых устройствах.'],
 ['1.2','Исправлен критический баг: сразу после нажатия «Новая игра» игра намертво зависала и персонаж не мог сдвинуться с места. Исправлен крафт — клавиша C больше не выбрасывала ошибку. Исправлен секретный код «обнова», который раньше нельзя было ввести из-за слишком короткого буфера ввода.'],
 ['1.1','Первая публичная 3D-версия «Маяка молчания».']
];
function renderChangelog(){const el=document.getElementById('changelogList');el.innerHTML=CHANGELOG.map(([v,text])=>`<div class="craftRow"><div class="craftName">Версия ${v}</div><div class="craftDesc">${text}</div></div>`).join('');}
let savedQuality=null;try{savedQuality=localStorage.getItem('mayak_quality');}catch(e){}
const state={screen:'menu',room:'entrance',health:100,sanity:100,battery:100,flash:false,time:0,running:false,keys:{},inventory:{},journals:[],journalPage:0,won:false,ending:null,secretBuffer:'',noise:0,noiseX:0,noiseZ:0,volume:.5,sens:1,quality:savedQuality||(matchMedia('(pointer:coarse)').matches?'medium':'high'),lastNoise:null,controlsInverted:false,gunRevealed:false};
let scene,camera,renderer,flashlight,roomGroup,monsterMesh,monsterGlow,clock=new THREE.Clock();
const player={x:4,z:15,speed:3.35,run:5.25,radius:.35};
let yaw=0,pitch=0,ctx=null,master=null,drone=[],footTimer=0,actionTimer=0,mouseLocked=false;
let glitchTimer=6+Math.random()*5,phantomTimer=8+Math.random()*6,doorIllusionTimer=12+Math.random()*8,controlFlipTimer=24+Math.random()*10;
const texLoader=new THREE.TextureLoader();const texCache={};
function tex(file){if(!texCache[file]){const t=texLoader.load(A+file);if('encoding' in t)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;texCache[file]=t;}return texCache[file];}
const iconCache={};
function makeIconCanvas(kind){const c=document.createElement('canvas');c.width=64;c.height=64;const g2=c.getContext('2d');g2.clearRect(0,0,64,64);if(kind==='pistol'){g2.fillStyle='#2a2620';g2.fillRect(8,30,40,8);g2.fillRect(42,22,10,10);g2.fillRect(16,38,10,20);g2.fillStyle='#4a4234';g2.fillRect(46,25,6,4);}else if(kind==='bullets'){for(let i=0;i<3;i++){g2.fillStyle='#8a6a2a';g2.fillRect(14+i*14,18,8,7);g2.fillStyle='#c9a84a';g2.fillRect(14+i*14,25,8,21);}}return c;}
function iconEntry(kind){if(!iconCache[kind])iconCache[kind]={canvas:makeIconCanvas(kind)};return iconCache[kind];}
function iconDataUrl(kind){const e=iconEntry(kind);if(!e.url)e.url=e.canvas.toDataURL();return e.url;}
function iconTexture(kind){const e=iconEntry(kind);if(!e.tex)e.tex=new THREE.CanvasTexture(e.canvas);return e.tex;}
function iconSrc(file){return file.startsWith('CANVAS:')?iconDataUrl(file.slice(7)):A+file;}
function spriteMat(file){if(!spriteMatCache[file]){const map=file.startsWith('CANVAS:')?iconTexture(file.slice(7)):tex(file);const m=new THREE.SpriteMaterial({map,transparent:true,depthWrite:false});m.userData.cached=true;spriteMatCache[file]=m;}return spriteMatCache[file];}
// Материалы/геометрии, которые переиспользуются между комнатами (не удаляются при очистке сцены).
const matCache={};
function mat(file,repeat=1,rough=1){const key=file+'|'+repeat+'|'+rough;if(matCache[key])return matCache[key];let map=tex(file);if(repeat!==1){map=map.clone();map.needsUpdate=true;map.repeat.set(repeat,repeat);}const m=new THREE.MeshStandardMaterial({map,roughness:rough});m.userData.cached=true;matCache[key]=m;return m;}
const basicMatCache={};
function basicMat(file){if(!basicMatCache[file]){const m=new THREE.MeshBasicMaterial({map:tex(file),transparent:true,side:THREE.DoubleSide});m.userData.cached=true;basicMatCache[file]=m;}return basicMatCache[file];}
const spriteMatCache={};
const wallGeo=new THREE.BoxGeometry(TILE,WALL_H,TILE);wallGeo.userData.shared=true;
const planeGeo=new THREE.PlaneGeometry(COLS*TILE,ROWS*TILE);planeGeo.userData.shared=true;
const ceilMat=new THREE.MeshStandardMaterial({color:0x080706,roughness:1});ceilMat.userData.cached=true;
const QUALITY_PRESETS={
 high:{shadows:true,shadowSize:1024,pointShadows:true,pointShadowSize:512,pixelRatio:2,dust:170,menuStars:260,menuGlitter:true,menuOceanSegs:[64,40]},
 medium:{shadows:true,shadowSize:512,pointShadows:false,pointShadowSize:256,pixelRatio:1.5,dust:90,menuStars:140,menuGlitter:true,menuOceanSegs:[48,30]},
 low:{shadows:false,shadowSize:512,pointShadows:false,pointShadowSize:256,pixelRatio:1,dust:0,menuStars:60,menuGlitter:false,menuOceanSegs:[30,18]}
};
function qualityPreset(){return QUALITY_PRESETS[state.quality]||QUALITY_PRESETS.high;}
function applyQualityCore(){const p=qualityPreset();if(renderer){renderer.shadowMap.enabled=p.shadows;renderer.setPixelRatio(Math.min(p.pixelRatio,devicePixelRatio||1));resize();}if(menuRenderer)menuRenderer.setPixelRatio(Math.min(p.pixelRatio,devicePixelRatio||1));if(flashlight){flashlight.castShadow=p.shadows;if(flashlight.shadow.mapSize.width!==p.shadowSize){flashlight.shadow.mapSize.set(p.shadowSize,p.shadowSize);if(flashlight.shadow.map){flashlight.shadow.map.dispose();flashlight.shadow.map=null;}}}}
function applyQuality(q){if(!QUALITY_PRESETS[q])q='high';state.quality=q;applyQualityCore();try{localStorage.setItem('mayak_quality',q);}catch(e){}if(roomGroup)buildRoom(state.room);if(menuScene){const wasActive=menuActive;stopMenuScene();if(menuRenderer){menuRenderer.dispose();if(menuRenderer.domElement.parentNode)menuRenderer.domElement.parentNode.removeChild(menuRenderer.domElement);}menuScene=null;menuRenderer=null;if(wasActive)startMenuScene();}}
function cellCenter(x,y){return{x:x*TILE,z:y*TILE};}
function emitNoise(x,z,strength){state.lastNoise={x,z,time:state.time,strength};}
function doorCovers(room,x,y){return (room.doors||[]).some(d=>x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h);}
function isWall(room,x,y){return x<0||y<0||x>=COLS||y>=ROWS||(room.walls[y][x]&&!doorCovers(room,x,y));}
function init(){scene=new THREE.Scene();scene.background=new THREE.Color(0x020202);scene.fog=new THREE.FogExp2(0x050403,.042);camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,100);camera.position.set(player.x,1.62,player.z);renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);if('outputEncoding' in renderer)renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.getElementById('canvasWrap').appendChild(renderer.domElement);const amb=new THREE.HemisphereLight(0x292936,0x070504,.34);scene.add(amb);flashlight=new THREE.SpotLight(0xffd8a0,0,18,Math.PI/8,.62,1.55);flashlight.shadow.mapSize.width=1024;flashlight.shadow.mapSize.height=1024;camera.add(flashlight);flashlight.position.set(.15,-.05,.1);flashlight.target.position.set(0,0,-1);camera.add(flashlight.target);scene.add(camera);applyQualityCore();setupUI();setupControls();buildRoom('entrance');resize();requestAnimationFrame(loop);}
function clearGroup(){if(roomGroup){scene.remove(roomGroup);roomGroup.traverse(o=>{if(o.geometry&&!o.geometry.userData?.shared)o.geometry.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m&&!m.userData?.cached)m.dispose();});}});}roomGroup=new THREE.Group();roomGroup.userData.dustPoints=[];roomGroup.userData.flickerLights=[];scene.add(roomGroup);}
function buildRoom(name){state.room=name;const r=rooms[name];clearGroup();document.getElementById('roomName').textContent=r.name;const floor=new THREE.Mesh(planeGeo,mat('floor_tile.png',COLS/4));floor.rotation.x=-Math.PI/2;floor.position.set((COLS-1)*TILE/2,0,(ROWS-1)*TILE/2);floor.receiveShadow=true;roomGroup.add(floor);const ceil=new THREE.Mesh(planeGeo,ceilMat);ceil.rotation.x=Math.PI/2;ceil.position.set((COLS-1)*TILE/2,WALL_H,(ROWS-1)*TILE/2);roomGroup.add(ceil);const wallCells=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(r.walls[y][x]&&!doorCovers(r,x,y))wallCells.push([x,y]);if(wallCells.length){const wallMesh=new THREE.InstancedMesh(wallGeo,mat('wall_tile.png'),wallCells.length);wallMesh.castShadow=true;wallMesh.receiveShadow=true;const dummy=new THREE.Object3D();wallCells.forEach(([x,y],i)=>{dummy.position.set(x*TILE,1.5,y*TILE);dummy.updateMatrix();wallMesh.setMatrixAt(i,dummy.matrix);});wallMesh.instanceMatrix.needsUpdate=true;roomGroup.add(wallMesh);}for(const d of r.doors)buildDoor(d);for(const it of r.items)if(!state.inventory.__taken||!state.inventory.__taken[it.id])buildItem(it);for(const q of (r.interact||[]))buildInteract(q);buildDecor(name);buildRoomLights(name);resetMonsterForRoom();}
function buildDoor(d){const c=cellCenter(d.x,d.y);const locked=!!d.requires;const file=d.target==='ENDING'?'door_ending.png':locked?'door_locked.png':'door_wood.png';const h=Math.max(1.8,d.h*TILE);const w=Math.max(1.7,d.w*TILE);const geo=new THREE.PlaneGeometry(w,h);const mesh=new THREE.Mesh(geo,basicMat(file));mesh.position.set(c.x,Math.min(1.6,h/2),c.z);mesh.rotation.y=d.w>1?0:Math.PI/2;mesh.userData={door:d};roomGroup.add(mesh);}
function buildItem(it){const info=itemInfo[it.type];if(!info)return;const c=cellCenter(it.x,it.y);const s=new THREE.Sprite(spriteMat(info[1]));s.position.set(c.x,.75,c.z);s.scale.set(.85,.85,.85);s.userData={item:it};roomGroup.add(s);}
function buildInteract(q){const c=cellCenter(q.x,q.y);const file=q.type==='lantern'?'lantern_off.png':'lantern_on.png';const s=new THREE.Sprite(spriteMat(file));s.position.set(c.x,1.1,c.z);s.scale.set(1.2,1.2,1.2);s.userData={interact:q};roomGroup.add(s);}
function addDust(count){
  if(!count)return;
  const geo=new THREE.BufferGeometry(), pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){pos[i*3]=(Math.random()*(COLS-2)+1)*TILE;pos[i*3+1]=.45+Math.random()*2.15;pos[i*3+2]=(Math.random()*(ROWS-2)+1)*TILE;}
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pm=new THREE.PointsMaterial({color:0xb9aa8a,size:.025,transparent:true,opacity:.20,depthWrite:false});
  const pts=new THREE.Points(geo,pm);pts.userData.dust=true;roomGroup.add(pts);roomGroup.userData.dustPoints.push(pts);
}
function addBeam(x,y,z,w,d,h=.16){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x17110d,roughness:1}));m.position.set(x,y,z);m.castShadow=true;roomGroup.add(m);}
function addCrate(x,y,rot=0){const g=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:0x3a2819,roughness:.95}),dark=new THREE.MeshStandardMaterial({color:0x17100b,roughness:1});const b=new THREE.Mesh(new THREE.BoxGeometry(.95,.72,.95),wood);b.position.y=.36;b.castShadow=true;b.receiveShadow=true;g.add(b);for(const xx of [-.32,.32]){const sl=new THREE.Mesh(new THREE.BoxGeometry(.08,.78,.98),dark);sl.position.set(xx,.38,0);g.add(sl);}for(const zz of [-.32,.32]){const sl=new THREE.Mesh(new THREE.BoxGeometry(.98,.78,.08),dark);sl.position.set(0,.38,zz);g.add(sl);}g.position.set(x*TILE,.02,y*TILE);g.rotation.y=rot;roomGroup.add(g);}
function addBarrel(x,y){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x2a2119,roughness:.9}),metal=new THREE.MeshStandardMaterial({color:0x292622,metalness:.45,roughness:.7});const b=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.9,12),m);b.position.y=.45;b.castShadow=true;g.add(b);for(const yy of [.18,.7]){const r=new THREE.Mesh(new THREE.TorusGeometry(.39,.035,6,12),metal);r.rotation.x=Math.PI/2;r.position.y=yy;g.add(r);}g.position.set(x*TILE,.02,y*TILE);roomGroup.add(g);}
function addPuddle(x,y,scale){const m=new THREE.MeshStandardMaterial({color:0x11151a,roughness:.15,metalness:.1,transparent:true,opacity:.48});const p=new THREE.Mesh(new THREE.CircleGeometry(scale,24),m);p.rotation.x=-Math.PI/2;p.position.set(x*TILE,.009,y*TILE);roomGroup.add(p);}
function buildDecor(name){const r=rooms[name];addDust(qualityPreset().dust);for(let x=1;x<COLS-1;x+=3)addBeam(x*TILE,WALL_H-.10,(ROWS-1)*TILE/2,TILE*.12,(ROWS-2)*TILE,.16);for(let y=2;y<ROWS-1;y+=4)addBeam((COLS-1)*TILE/2,WALL_H-.16,y*TILE,(COLS-2)*TILE,.14,.18);const seed0=[...name].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),17);let seed=seed0;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let i=0;i<9;i++){const x=1+Math.floor(rnd()*(COLS-2)),y=1+Math.floor(rnd()*(ROWS-2));if(isWall(r,x,y)||doorCovers(r,x,y))continue;if(i%3===0)addCrate(x,y,rnd()*Math.PI);else if(i%3===1)addBarrel(x,y);else addPuddle(x,y,.18+rnd()*.30);}for(let i=0;i<22;i++){const x=1+Math.floor(rnd()*(COLS-2)),y=1+Math.floor(rnd()*(ROWS-2));if(isWall(r,x,y))continue;const geo=new THREE.PlaneGeometry(.18+rnd()*.55,.025+rnd()*.06),m=new THREE.MeshBasicMaterial({color:0x120e0b,transparent:true,opacity:.28,side:THREE.DoubleSide});const p=new THREE.Mesh(geo,m);p.rotation.x=-Math.PI/2;p.rotation.z=rnd()*Math.PI;p.position.set(x*TILE+(rnd()-.5),.012,y*TILE+(rnd()-.5));roomGroup.add(p);}}
function buildRoomLights(name){const lights=[];if(name==='entrance')lights.push([3,3,0xa87a3a,.22,4],[17,12,0x6f4930,.16,3]);else if(name==='storage')lights.push([5,12,0xa87a3a,.16,4],[15,4,0x6d4b2a,.13,3]);else if(name==='stairs')lights.push([10,11,0xa87a3a,.18,4],[16,3,0x5d4a38,.12,3]);else if(name==='lantern')lights.push([10,5,0xa87a3a,.62,8]);else if(name==='archive')lights.push([16,5,0x74634b,.14,4],[8,11,0x5c4633,.10,3]);else if(name==='basement')lights.push([11,7,0x6b4b31,.13,4],[3,12,0x533a28,.09,3]);else if(name==='roof')lights.push([15,4,0x9fbf92,.65,9]);else if(name==='secret')lights.push([10,8,0x7a1f1f,.72,8]);const p=qualityPreset();lights.forEach(([x,z,col,int,dist])=>{const l=new THREE.PointLight(col,int,dist);l.position.set(x*TILE,2.15,z*TILE);if(p.pointShadows){l.castShadow=true;l.shadow.mapSize.width=p.pointShadowSize;l.shadow.mapSize.height=p.pointShadowSize;}roomGroup.add(l);l.userData.flicker={base:int,phase:Math.random()*10};roomGroup.userData.flickerLights.push(l);});}
function resetMonsterForRoom(){if(monsterMesh)monsterMesh.visible=false;const r=rooms[state.room];if(!r.monster)return;if(!monsterMesh){const sm=new THREE.SpriteMaterial({map:tex('monster.png'),transparent:true,depthWrite:false});monsterMesh=new THREE.Sprite(sm);monsterMesh.scale.set(1.55,2.7,1);scene.add(monsterMesh);monsterGlow=new THREE.PointLight(0x551111,.35,3);scene.add(monsterGlow);}monster.active=false;monster.timer=4+Math.random()*4;monster.x=(Math.random()<.5?2:COLS-3)*TILE;monster.z=(Math.random()<.5?2:ROWS-3)*TILE;monster.hunting=false;monster.scaredUntil=0;monster.mode='idle';monster.wanderAngle=Math.random()*Math.PI*2;monsterMesh.visible=false;}
const monster={active:false,timer:4,x:0,z:0,hunting:false,scaredUntil:0,mode:'idle',wanderAngle:0};

// ===== Сцена главного меню: берег ночью, маяк, стол с лампой и журналом =====
let menuScene,menuCamera,menuRenderer,menuActive=false,menuAnimId=null,menuTime=0,menuFrameCounter=0;
let oceanMesh,oceanBasePos,beamGroup,lampLight,journalCover,radioIndicator,rainMeshInst,rainData;
let journalTargetRot=0,lampTargetIntensity=1.35,lampCurrentIntensity=0;
const rainDummy=new THREE.Object3D();
function makeRadialTexture(inner,outer,size){size=size||128;const c=document.createElement('canvas');c.width=c.height=size;const g2=c.getContext('2d');const g=g2.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);g.addColorStop(0,inner);g.addColorStop(1,outer);g2.fillStyle=g;g2.fillRect(0,0,size,size);return new THREE.CanvasTexture(c);}
function makeStreakTexture(){const c=document.createElement('canvas');c.width=16;c.height=64;const g2=c.getContext('2d');const g=g2.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(190,210,230,0)');g.addColorStop(.5,'rgba(190,210,230,.6)');g.addColorStop(1,'rgba(190,210,230,0)');g2.fillStyle=g;g2.fillRect(0,0,16,64);return new THREE.CanvasTexture(c);}
function makeSparkleTexture(){const size=256,c=document.createElement('canvas');c.width=c.height=size;const g2=c.getContext('2d');g2.fillStyle='#000';g2.fillRect(0,0,size,size);for(let i=0;i<220;i++){const x=Math.random()*size,y=Math.random()*size,rr=Math.random()*1.3+.2,a=Math.random()*.5;g2.fillStyle=`rgba(205,222,240,${a})`;g2.beginPath();g2.arc(x,y,rr,0,Math.PI*2);g2.fill();}return new THREE.CanvasTexture(c);}
function makePaperTexture(){const c=document.createElement('canvas');c.width=128;c.height=96;const g2=c.getContext('2d');g2.fillStyle='#cdb489';g2.fillRect(0,0,128,96);g2.strokeStyle='rgba(90,70,40,.35)';g2.lineWidth=1;for(let y=10;y<90;y+=9){g2.beginPath();g2.moveTo(8,y+(Math.random()*2-1));g2.lineTo(118,y+(Math.random()*2-1));g2.stroke();}g2.fillStyle='rgba(60,45,25,.15)';g2.fillRect(0,0,128,96);return new THREE.CanvasTexture(c);}
const SAVE_KEY='mayak_save_v1';
function hasSave(){try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({room:state.room,px:player.x,pz:player.z,yaw,pitch,health:state.health,sanity:state.sanity,battery:state.battery,inventory:state.inventory,journals:state.journals,taken:state.inventory.__taken||{},lanternDone,roofDone,gunRevealed:state.gunRevealed}));}catch(e){}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
function loadGame(){let data=null;try{data=JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){}if(!data){startGame();return;}state.keys={};state.running=false;state.screen='playing';document.getElementById('menu').classList.add('hidden');document.getElementById('hud').style.display='block';state.health=data.health??100;state.sanity=data.sanity??100;state.battery=data.battery??100;state.flash=false;state.inventory=data.inventory||{};state.inventory.__taken=data.taken||{};state.journals=data.journals||[];state.journalPage=0;state.won=false;state.ending=null;state.secretBuffer='';state.lastNoise=null;state.controlsInverted=false;state.gunRevealed=!!data.gunRevealed;glitchTimer=6+Math.random()*5;phantomTimer=8+Math.random()*6;doorIllusionTimer=12+Math.random()*8;controlFlipTimer=24+Math.random()*10;lanternDone=!!data.lanternDone;roofDone=!!data.roofDone;player.x=data.px??4*TILE;player.z=data.pz??7*TILE;buildRoom(data.room||'entrance');camera.position.set(player.x,1.62,player.z);yaw=data.yaw||0;pitch=data.pitch||0;initAudio();startAudio();renderer.domElement.focus();updateHUD();}

function menuRainCount(){const q=qualityPreset();return q.dust?Math.round(q.dust*1.15):0;}
function buildMenuLighthouse(){
  const g=new THREE.Group();g.position.set(-9,0,-46);
  const rock=new THREE.Mesh(new THREE.CylinderGeometry(3.2,4.2,1.6,7),new THREE.MeshStandardMaterial({color:0x0d0f10,roughness:1}));
  rock.position.y=.8;g.add(rock);
  const rockMat=new THREE.MeshStandardMaterial({color:0x101112,roughness:1});
  for(let i=0;i<4;i++){const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(.4+Math.random()*.55,0),rockMat);rk.position.set((Math.random()-.5)*5.5,.3,(Math.random()-.5)*2.6+1.4);rk.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);g.add(rk);}
  const towerMat=new THREE.MeshStandardMaterial({color:0xcfc7b4,roughness:.85});
  const stripeMat=new THREE.MeshStandardMaterial({color:0x2a2420,roughness:.85});
  const winMat=new THREE.MeshBasicMaterial({color:0xffcf8a,transparent:true,opacity:.85});
  let y=1.6;
  for(let i=0;i<5;i++){
    const h=1.8,rad=1.15-i*.07,seg=new THREE.Mesh(new THREE.CylinderGeometry(rad,1.25-i*.07,h,10),i%2?stripeMat:towerMat);
    seg.position.y=y+h/2;g.add(seg);
    if(i%2===0){const win=new THREE.Mesh(new THREE.PlaneGeometry(.16,.26),winMat);win.position.set(0,y+h/2,rad+.01);g.add(win);}
    y+=h;
  }
  const lantern=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,1.1,10),new THREE.MeshStandardMaterial({color:0x30281c,roughness:.6}));
  lantern.position.y=y+.55;g.add(lantern);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(.95,.025,6,16),new THREE.MeshStandardMaterial({color:0x221c14,roughness:.7}));
  rail.rotation.x=Math.PI/2;rail.position.y=y+.02;g.add(rail);
  const dome=new THREE.Mesh(new THREE.ConeGeometry(.95,.8,10),new THREE.MeshStandardMaterial({color:0x1c1712,roughness:.7}));
  dome.position.y=y+1.5;g.add(dome);
  const glow=new THREE.PointLight(0xffcf8a,1.3,11);glow.position.y=y+.55;g.add(glow);
  beamGroup=new THREE.Group();beamGroup.position.y=y+.55;
  const beamMat1=new THREE.MeshBasicMaterial({color:0xffe3ad,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending});
  const beam1=new THREE.Mesh(new THREE.BoxGeometry(40,.5,4.2),beamMat1);beam1.position.x=20;beamGroup.add(beam1);
  const beamMat2=new THREE.MeshBasicMaterial({color:0xffe3ad,transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending});
  const beam2=new THREE.Mesh(new THREE.BoxGeometry(40,1.1,9),beamMat2);beam2.position.x=20;beamGroup.add(beam2);
  g.add(beamGroup);
  menuScene.add(g);
}
function buildMenuTable(){
  const g=new THREE.Group();g.position.set(1.5,0,1.9);g.rotation.y=-.5;
  const topMat=new THREE.MeshStandardMaterial({color:0x2a1c10,roughness:.9});
  const legMat=new THREE.MeshStandardMaterial({color:0x18100a,roughness:.95});
  const top=new THREE.Mesh(new THREE.BoxGeometry(1.15,.08,.75),topMat);top.position.y=.72;g.add(top);
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,.7,8),legMat);leg.position.y=.35;g.add(leg);
  const journal=new THREE.Group();journal.position.set(-.22,.765,.05);journal.rotation.y=.25;
  const paperTex=makePaperTexture();
  const base=new THREE.Mesh(new THREE.BoxGeometry(.42,.035,.3),new THREE.MeshStandardMaterial({map:paperTex,roughness:.85}));journal.add(base);
  const coverPivot=new THREE.Group();coverPivot.position.set(-.21,.018,0);
  const cover=new THREE.Mesh(new THREE.BoxGeometry(.42,.02,.3),new THREE.MeshStandardMaterial({color:0x5c4128,roughness:.7}));cover.position.x=.21;coverPivot.add(cover);
  journal.add(coverPivot);journalCover=coverPivot;g.add(journal);
  const keyMat=new THREE.MeshStandardMaterial({color:0x8a7040,roughness:.5,metalness:.6});
  const keyGroup=new THREE.Group();keyGroup.position.set(.06,.775,.24);keyGroup.rotation.set(-Math.PI/2,0,.5);
  keyGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.09,6),keyMat));
  const bow=new THREE.Mesh(new THREE.TorusGeometry(.02,.006,6,10),keyMat);bow.position.y=.05;keyGroup.add(bow);
  const tooth=new THREE.Mesh(new THREE.BoxGeometry(.02,.012,.006),keyMat);tooth.position.y=-.045;keyGroup.add(tooth);
  g.add(keyGroup);
  const inkwell=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.03,8),new THREE.MeshStandardMaterial({color:0x0e0e0e,roughness:.4}));
  inkwell.position.set(.42,.755,.12);g.add(inkwell);
  const quill=new THREE.Mesh(new THREE.CylinderGeometry(.002,.005,.16,5),new THREE.MeshStandardMaterial({color:0xe8e2d8,roughness:.8}));
  quill.position.set(.4,.79,.1);quill.rotation.set(.2,0,.9);g.add(quill);
  const lamp=new THREE.Group();lamp.position.set(.28,.76,-.08);
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.05,10),legMat));
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.16,8),legMat);stem.position.y=.1;lamp.add(stem);
  const globe=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),new THREE.MeshStandardMaterial({color:0xffdca0,emissive:0xffb35c,emissiveIntensity:.9,transparent:true,opacity:.75,roughness:.3}));globe.position.y=.22;lamp.add(globe);
  lampLight=new THREE.PointLight(0xffb35c,0,3.4);lampLight.position.y=.24;lamp.add(lampLight);
  const glowTex=makeRadialTexture('rgba(255,190,110,0.55)','rgba(255,190,110,0)');
  const lampHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  lampHalo.scale.set(.9,.9,1);lampHalo.position.y=.24;lamp.add(lampHalo);
  g.add(lamp);
  menuScene.add(g);
}
function buildMenuRadio(){
  const g=new THREE.Group();g.position.set(1.85,.02,2.55);g.rotation.y=-.5;
  const body=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.16),new THREE.MeshStandardMaterial({color:0x1c1712,roughness:.8}));body.position.y=.08;g.add(body);
  const dial=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.02,10),new THREE.MeshStandardMaterial({color:0x8a7550}));dial.rotation.x=Math.PI/2;dial.position.set(.08,.08,.09);g.add(dial);
  radioIndicator=new THREE.Mesh(new THREE.SphereGeometry(.012,6,6),new THREE.MeshBasicMaterial({color:0x2a0808}));radioIndicator.position.set(-.08,.12,.09);g.add(radioIndicator);
  menuScene.add(g);
}
function setRadioOn(on){if(radioIndicator)radioIndicator.material.color.setHex(on?0xff5533:0x2a0808);}
function buildMenuRain(){
  const count=menuRainCount();if(!count)return;
  const geo=new THREE.PlaneGeometry(.05,.6);
  const mat=new THREE.MeshBasicMaterial({map:makeStreakTexture(),transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide});
  rainMeshInst=new THREE.InstancedMesh(geo,mat,count);rainData=new Float32Array(count*3);
  for(let i=0;i<count;i++){const x=(Math.random()-.5)*30,y=Math.random()*14,z=(Math.random()-.5)*20-4;rainData[i*3]=x;rainData[i*3+1]=y;rainData[i*3+2]=z;rainDummy.position.set(x,y,z);rainDummy.rotation.set(0,0,.12);rainDummy.updateMatrix();rainMeshInst.setMatrixAt(i,rainDummy.matrix);}
  menuScene.add(rainMeshInst);
}
function updateRain(dt){if(!rainMeshInst)return;const n=rainMeshInst.count;for(let i=0;i<n;i++){rainData[i*3+1]-=dt*9;if(rainData[i*3+1]<-.5){rainData[i*3+1]=12+Math.random()*3;rainData[i*3]=(Math.random()-.5)*30;rainData[i*3+2]=(Math.random()-.5)*20-4;}rainDummy.position.set(rainData[i*3],rainData[i*3+1],rainData[i*3+2]);rainDummy.rotation.set(0,0,.12);rainDummy.updateMatrix();rainMeshInst.setMatrixAt(i,rainDummy.matrix);}rainMeshInst.instanceMatrix.needsUpdate=true;}
let starsPoints,moonSprite,glitterMesh,foamMesh;
function buildMenuStars(){
  const count=qualityPreset().menuStars||0;if(!count)return;
  const geo=new THREE.BufferGeometry(),pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){const theta=Math.random()*Math.PI*2,phi=Math.random()*.55,r=95;pos[i*3]=Math.sin(phi)*Math.cos(theta)*r;pos[i*3+1]=9+Math.cos(phi)*r*.5;pos[i*3+2]=Math.sin(phi)*Math.sin(theta)*r-35;}
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  starsPoints=new THREE.Points(geo,new THREE.PointsMaterial({color:0xdfe8ff,size:.5,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:false}));
  menuScene.add(starsPoints);
}
function buildMenuMoon(){
  const glowTex=makeRadialTexture('rgba(210,225,255,0.85)','rgba(210,225,255,0)');
  moonSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));
  moonSprite.scale.set(14,14,1);moonSprite.position.set(-16,20,-70);menuScene.add(moonSprite);
  const core=new THREE.Mesh(new THREE.CircleGeometry(1.1,24),new THREE.MeshBasicMaterial({color:0xdfe6f2,transparent:true,opacity:.75}));
  core.position.copy(moonSprite.position);core.lookAt(0,1.55,5.6);menuScene.add(core);
}
function buildMenuGlitter(){
  if(!qualityPreset().menuGlitter)return;
  const tex=makeSparkleTexture();tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(6,4);
  const geo=new THREE.PlaneGeometry(120,70);geo.rotateX(-Math.PI/2);
  glitterMesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.15,blending:THREE.AdditiveBlending,depthWrite:false}));
  glitterMesh.position.set(0,-.02,-30);menuScene.add(glitterMesh);
}
function buildMenuFoam(){
  const geo=new THREE.PlaneGeometry(40,1.4);geo.rotateX(-Math.PI/2);
  foamMesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xbfd6e0,transparent:true,opacity:.14,depthWrite:false}));
  foamMesh.position.set(0,-.01,1.7);menuScene.add(foamMesh);
}
function buildMenuScene(){
  const p=qualityPreset();
  menuScene=new THREE.Scene();menuScene.background=new THREE.Color(0x03060b);menuScene.fog=new THREE.FogExp2(0x050a12,.028);
  menuCamera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,200);menuCamera.position.set(0,1.55,5.6);menuCamera.lookAt(-2.2,2.2,-40);
  menuRenderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});menuRenderer.setSize(innerWidth,innerHeight);menuRenderer.setPixelRatio(Math.min(p.pixelRatio,devicePixelRatio||1));
  if('outputEncoding' in menuRenderer)menuRenderer.outputEncoding=THREE.sRGBEncoding;
  document.getElementById('menuCanvasWrap').appendChild(menuRenderer.domElement);
  menuScene.add(new THREE.HemisphereLight(0x1c2636,0x02040a,.55));
  const moon=new THREE.DirectionalLight(0x8fa2c0,.18);moon.position.set(-10,25,10);menuScene.add(moon);
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(40,10),new THREE.MeshStandardMaterial({color:0x1a1712,roughness:1}));sand.rotation.x=-Math.PI/2;sand.position.set(0,-.02,3.5);menuScene.add(sand);
  const [sx,sz]=p.menuOceanSegs;
  const oceanGeo=new THREE.PlaneGeometry(140,90,sx,sz);oceanGeo.rotateX(-Math.PI/2);oceanBasePos=oceanGeo.attributes.position.array.slice();
  oceanMesh=new THREE.Mesh(oceanGeo,new THREE.MeshStandardMaterial({color:0x061620,roughness:.24,metalness:.4}));oceanMesh.position.set(0,-.05,-30);menuScene.add(oceanMesh);
  buildMenuStars();buildMenuMoon();buildMenuGlitter();buildMenuFoam();
  buildMenuLighthouse();buildMenuTable();buildMenuRadio();buildMenuRain();
}
function updateOcean(t){if(!oceanMesh)return;const pos=oceanMesh.geometry.attributes.position,base=oceanBasePos;for(let i=0;i<pos.count;i++){const ix=i*3,x=base[ix],z=base[ix+2];pos.array[ix+1]=Math.sin(x*.09+t*1.1)*.16+Math.sin(z*.14-t*.7)*.12+Math.sin((x+z)*.05+t*.5)*.08;}pos.needsUpdate=true;}
function menuLoop(){if(!menuActive)return;menuAnimId=requestAnimationFrame(menuLoop);const dt=Math.min(.05,menuClockDelta());menuTime+=dt;menuFrameCounter=(menuFrameCounter+1)%2;if(state.quality==='high'||menuFrameCounter===0)updateOcean(menuTime);if(beamGroup)beamGroup.rotation.y+=dt*.35;updateRain(dt);if(journalCover)journalCover.rotation.x+=(journalTargetRot-journalCover.rotation.x)*Math.min(1,dt*5);if(lampLight){lampCurrentIntensity+=(lampTargetIntensity-lampCurrentIntensity)*Math.min(1,dt*3);lampLight.intensity=Math.max(0,lampCurrentIntensity+Math.sin(menuTime*9)*.05);}if(starsPoints)starsPoints.material.opacity=.42+Math.sin(menuTime*1.3)*.14;if(glitterMesh){glitterMesh.material.map.offset.x=menuTime*.015;glitterMesh.material.map.offset.y=menuTime*.008;}if(foamMesh)foamMesh.position.z=1.7+Math.sin(menuTime*.6)*.25;menuCamera.position.x=Math.sin(menuTime*.22)*.05;menuCamera.position.y=1.55+Math.sin(menuTime*.35)*.015;menuCamera.lookAt(-2.2,2.2,-40);menuRenderer.render(menuScene,menuCamera);}
let menuClock=new THREE.Clock();function menuClockDelta(){return menuClock.getDelta();}
function startMenuScene(){if(!menuScene)buildMenuScene();menuActive=true;lampTargetIntensity=1.35;lampCurrentIntensity=0;journalTargetRot=0;if(journalCover)journalCover.rotation.x=0;document.getElementById('menuFade').classList.remove('show');document.getElementById('continueBtn').classList.toggle('hidden',!hasSave());menuClock.getDelta();menuLoop();}
function stopMenuScene(){menuActive=false;if(menuAnimId)cancelAnimationFrame(menuAnimId);}
function playPageSound(){tone(220,.06,.02,'triangle');setTimeout(()=>tone(180,.08,.018,'triangle'),70);}
function playRadioCrackle(){initAudio();if(!ctx)return;const dur=.35,bufferSize=Math.floor(ctx.sampleRate*dur),buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<bufferSize;i++)data[i]=(Math.random()*2-1)*(1-i/bufferSize);const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=buffer;g.gain.value=.05;src.connect(g);g.connect(master);src.start();}
function beginFromMenu(isContinue){if(isContinue&&!hasSave())return;initAudio();journalTargetRot=-2.05;playPageSound();document.querySelectorAll('#menuButtons .gbtn').forEach(b=>b.disabled=true);setTimeout(()=>{document.querySelectorAll('#menuButtons .gbtn').forEach(b=>b.disabled=false);stopMenuScene();if(isContinue)loadGame();else startGame();},680);}
function exitLamp(){lampTargetIntensity=0;journalTargetRot=0;document.getElementById('menuFade').classList.add('show');}
function cancelExitLamp(){lampTargetIntensity=1.35;document.getElementById('menuFade').classList.remove('show');}

function setupControls(){
  const canvas=renderer.domElement;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Игровой экран');
  const keyDown=e=>{
    const k=(e.key||'').toLowerCase();
    if(!k)return;
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' ','f','e','i','j','c','g','escape'].includes(k))e.preventDefault();
    state.keys[k]=true;
    if(state.screen==='playing'){
      if(k==='f'&&!e.repeat)toggleFlash();
      if(k==='e'&&!e.repeat)interact();
      if(k==='i'&&!e.repeat)openModal('inventoryModal');
      if(k==='j'&&!e.repeat)openJournal();
      if(k==='c'&&!e.repeat)openCraft();
      if(k==='g'&&!e.repeat)firePistol();
      if(k==='escape'&&!e.repeat)pause();
      if(k==='shift')state.running=true;
      if(/[а-яё]/i.test(k)){state.secretBuffer=(state.secretBuffer+k).slice(-6);if(state.secretBuffer==='обнова')secretRoom();}
    }else if(k==='escape'&&!e.repeat){
      if(state.screen==='paused')resume();
      closeAllModals();
    }
  };
  const keyUp=e=>{
    const k=(e.key||'').toLowerCase();
    state.keys[k]=false;
    if(k==='shift')state.running=false;
  };
  document.addEventListener('keydown',keyDown,{capture:true});
  document.addEventListener('keyup',keyUp,{capture:true});
  window.addEventListener('blur',()=>{state.keys={};state.running=false;});
  canvas.addEventListener('click',()=>{
    canvas.focus();
    if(state.screen==='playing'&&document.pointerLockElement!==canvas)canvas.requestPointerLock?.();
  });
  canvas.addEventListener('mousedown',()=>canvas.focus());
  document.addEventListener('pointerlockchange',()=>{mouseLocked=document.pointerLockElement===canvas;});
  window.addEventListener('mousemove',e=>{
    if(!mouseLocked||state.screen!=='playing')return;
    yaw-=e.movementX*.0022*state.sens;
    pitch-=e.movementY*.0022*state.sens;
    pitch=Math.max(-1.25,Math.min(1.25,pitch));
  });
  window.addEventListener('resize',resize);
}
function setupTouch(){const joy=document.getElementById('joy'),stick=document.getElementById('stick'),look=document.getElementById('look'),fb=document.getElementById('flashTouch');let jid=null,lid=null,cx=0,cy=0,lx=0,ly=0;joy.addEventListener('touchstart',e=>{const t=e.changedTouches[0];jid=t.identifier;const r=joy.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;e.preventDefault();},{passive:false});look.addEventListener('touchstart',e=>{const t=e.changedTouches[0];lid=t.identifier;lx=t.clientX;ly=t.clientY;e.preventDefault();},{passive:false});window.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===jid){let dx=t.clientX-cx,dy=t.clientY-cy,d=Math.min(36,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);dx=Math.cos(a)*d;dy=Math.sin(a)*d;stick.style.transform=`translate(${dx}px,${dy}px)`;state.keys.w=dy<-10;state.keys.s=dy>10;state.keys.a=dx<-10;state.keys.d=dx>10;state.running=d>29;e.preventDefault();}if(t.identifier===lid){yaw-=(t.clientX-lx)*.005*state.sens;pitch-=(t.clientY-ly)*.005*state.sens;pitch=Math.max(-1.25,Math.min(1.25,pitch));lx=t.clientX;ly=t.clientY;e.preventDefault();}}},{passive:false});window.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===jid){jid=null;stick.style.transform='';state.keys.w=state.keys.s=state.keys.a=state.keys.d=false;state.running=false}else if(t.identifier===lid)lid=null;});fb.addEventListener('touchstart',e=>{e.preventDefault();toggleFlash();},{passive:false});}
function resize(){if(camera&&renderer){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}if(menuCamera&&menuRenderer){menuCamera.aspect=innerWidth/innerHeight;menuCamera.updateProjectionMatrix();menuRenderer.setSize(innerWidth,innerHeight);}}
function setupUI(){document.getElementById('startBtn').onclick=()=>beginFromMenu(false);document.getElementById('continueBtn').onclick=()=>beginFromMenu(true);document.getElementById('exitBtn').onclick=exitLamp;document.getElementById('menuFadeBack').onclick=cancelExitLamp;document.getElementById('resumeBtn').onclick=resume;document.getElementById('restartBtn').onclick=()=>location.reload();document.getElementById('winRestart').onclick=()=>location.reload();document.getElementById('settingsBtn').onclick=()=>{openModal('settingsModal');setRadioOn(true);playRadioCrackle();};document.getElementById('pauseSettings').onclick=()=>openModal('settingsModal');document.getElementById('pauseInv').onclick=()=>openModal('inventoryModal');document.getElementById('changelogBtn').onclick=()=>openModal('changelogModal');document.getElementById('telegramBtn').onclick=()=>window.open('https://t.me/NaghWCH','_blank','noopener');document.getElementById('quitBtn').onclick=()=>{saveGame();state.screen='menu';document.getElementById('pause').classList.add('hidden');document.getElementById('hud').style.display='none';document.getElementById('menu').classList.remove('hidden');document.exitPointerLock?.();stopAudio();startMenuScene();};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));document.getElementById('journalPrev').onclick=()=>changeJournal(-1);document.getElementById('journalNext').onclick=()=>changeJournal(1);document.getElementById('volumeRange').oninput=e=>{state.volume=e.target.value/100;if(master)master.gain.value=state.volume;};document.getElementById('sensRange').oninput=e=>state.sens=e.target.value/100;const qs=document.getElementById('qualitySelect');qs.value=state.quality;qs.onchange=e=>applyQuality(e.target.value);}
function openModal(id){document.getElementById(id).classList.remove('hidden');if(id==='inventoryModal')renderInventory();if(id==='journalModal')renderJournal();if(id==='craftModal')renderCraft();if(id==='changelogModal')renderChangelog();if(state.screen==='playing'&&document.pointerLockElement)document.exitPointerLock();}
function closeModal(id){document.getElementById(id).classList.add('hidden');if(id==='settingsModal')setRadioOn(false);}
function closeAllModals(){document.querySelectorAll('.modal').forEach(x=>x.classList.add('hidden'));}
function renderInventory(){const el=document.getElementById('invGrid');el.innerHTML='';Object.keys(itemInfo).forEach(k=>{if(k==='journal')return;const n=state.inventory[k]||0;const d=document.createElement('div');d.className='invCell';d.innerHTML=`<img src="${iconSrc(itemInfo[k][1])}"><strong>${itemInfo[k][0]}</strong><span>x${n}</span>`;el.appendChild(d);});}
function renderJournal(){const idx=Math.max(0,Math.min(state.journals.length-1,state.journalPage));const page=state.journals[idx];document.getElementById('journalTitle').textContent=JOURNAL[page]?.[0]||'ЗАПИСИ';document.getElementById('journalPage').textContent=JOURNAL[page]?.[1]||'Ты ещё не нашёл ни одной записи.';document.getElementById('journalCounter').textContent=`${idx+1}/${state.journals.length}`;document.getElementById('journalPrev').disabled=idx<=0;document.getElementById('journalNext').disabled=idx>=state.journals.length-1;}
function changeJournal(d){state.journalPage=Math.max(0,Math.min(Math.max(0,state.journals.length-1),state.journalPage+d));renderJournal();}
function renderCraft(){const el=document.getElementById('craftList');el.innerHTML='';recipes.forEach(r=>{const ok=Object.entries(r.cost).every(([k,v])=>(state.inventory[k]||0)>=v);const d=document.createElement('div');d.className='craftRow '+(ok?'':'disabled');d.innerHTML=`<div class="craftName">${r.name}</div><div class="craftDesc">${r.desc}</div><div class="craftCost">${Object.entries(r.cost).map(([k,v])=>`${itemInfo[k]?.[0]||k}: ${state.inventory[k]||0}/${v}`).join(' · ')}</div><button class="gbtn" ${ok?'':'disabled'}>Скрафтить</button>`;d.querySelector('button').onclick=()=>craft(r);el.appendChild(d);});}
function craft(r){if(!Object.entries(r.cost).every(([k,v])=>(state.inventory[k]||0)>=v))return;for(const [k,v] of Object.entries(r.cost))state.inventory[k]-=v;state.inventory[r.id]=(state.inventory[r.id]||0)+1;playClick();renderCraft();updateHUD();showMsg('Создано: '+r.name);}
function startGame(){state.keys={};state.running=false;state.screen='playing';document.getElementById('menu').classList.add('hidden');document.getElementById('hud').style.display='block';state.health=100;state.sanity=100;state.battery=100;state.flash=false;state.inventory={};state.journals=[];state.journalPage=0;state.won=false;state.ending=null;state.secretBuffer='';state.inventory.__taken={};state.lastNoise=null;state.controlsInverted=false;state.gunRevealed=false;glitchTimer=6+Math.random()*5;phantomTimer=8+Math.random()*6;doorIllusionTimer=12+Math.random()*8;controlFlipTimer=24+Math.random()*10;player.x=4*TILE;player.z=7*TILE;buildRoom('entrance');camera.position.set(player.x,1.62,player.z);yaw=0;pitch=0;initAudio();startAudio();renderer.domElement.focus();updateHUD();}
function pause(){if(state.screen!=='playing')return;state.screen='paused';saveGame();document.getElementById('pause').classList.remove('hidden');document.exitPointerLock?.();}
function resume(){if(state.won)return;state.screen='playing';document.getElementById('pause').classList.add('hidden');renderer.domElement.requestPointerLock?.();}
function toggleFlash(){if(state.battery<=0&&!state.flash){showMsg('Батарея села.');return;}state.flash=!state.flash;playClick();}
function tryMove(nx,nz){const r=rooms[state.room],rad=player.radius;for(let y=Math.floor(nz/TILE)-1;y<=Math.floor(nz/TILE)+1;y++)for(let x=Math.floor(nx/TILE)-1;x<=Math.floor(nx/TILE)+1;x++)if(isWall(r,x,y)){const wx=x*TILE,wz=y*TILE,cx=Math.max(wx-TILE/2,Math.min(nx,wx+TILE/2)),cz=Math.max(wz-TILE/2,Math.min(nz,wz+TILE/2));if((nx-cx)**2+(nz-cz)**2<rad*rad)return false;}return true;}
function updatePlayer(dt){const k=state.keys||{};let f=(k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0),side=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0);if(state.controlsInverted){f=-f;side=-side;}let mx=0,mz=0;const sy=Math.sin(yaw),cy=Math.cos(yaw);mx+=-sy*f+cy*side;mz+=-cy*f-sy*side;const len=Math.hypot(mx,mz);let moving=len>.01;if(moving){mx/=len;mz/=len;}const sp=(state.running?player.run:player.speed)*dt;const nx=player.x+mx*sp,nz=player.z+mz*sp;if(tryMove(nx,player.z))player.x=nx;if(tryMove(player.x,nz))player.z=nz;camera.position.set(player.x,1.62+(moving?Math.sin(state.time*(state.running?14:9))*.035:0),player.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;flashlight.intensity=state.flash?2.55:0;if(state.flash){state.battery=Math.max(0,state.battery-dt*3.0);if(state.battery<=0){state.flash=false;showMsg('Батарея села.');}}if(moving){state.noise=state.running?1:.35;state.noiseX=player.x;state.noiseZ=player.z;footTimer-=dt;if(footTimer<=0){footTimer=state.running?.27:.43;playStep();emitNoise(player.x,player.z,state.running?.95:.4);}}else{state.noise=Math.max(0,state.noise-dt*.7);}updateDoors();updateHUD();}
function nearestDoor(){const r=rooms[state.room];let best=null,bd=1.7;for(const d of r.doors){const c=cellCenter(d.x,d.y),dist=Math.hypot(player.x-c.x,player.z-c.z);if(dist<bd){best=d;bd=dist;}}return best;}
function nearestItem(){const r=rooms[state.room];let best=null,bd=.95;for(const it of r.items){if(state.inventory.__taken?.[it.id])continue;const c=cellCenter(it.x,it.y),dist=Math.hypot(player.x-c.x,player.z-c.z);if(dist<bd){best=it;bd=dist;}}return best;}
function nearestInteract(){const r=rooms[state.room];let best=null,bd=1.25;for(const q of (r.interact||[])){const c=cellCenter(q.x,q.y),dist=Math.hypot(player.x-c.x,player.z-c.z);if(dist<bd){best=q;bd=dist;}}return best;}
function updateDoors(){const d=nearestDoor(),it=nearestItem(),q=nearestInteract();let text='';if(it)text=`E — взять: ${itemInfo[it.type]?.[0]||it.type}`;else if(q)text='E — взаимодействовать';else if(d)text=d.requires?`E — дверь (${requireText(d.requires)})`:'E — открыть дверь';const h=document.getElementById('hint');h.textContent=text;h.style.opacity=text?'1':'0';}
function requireText(r){return r==='fuel'?'нужно топливо':r==='key'?'нужен ключ':r==='journals'?'нужны все записи':r==='archive'?'нужно найти путь через архив':'закрыто';}
function interact(){if(state.screen!=='playing')return;const it=nearestItem();if(it){takeItem(it);return;}if((state.inventory.shiv||0)>0&&monster.active&&monster.hunting&&Math.hypot(player.x-monster.x,player.z-monster.z)<2.0){state.inventory.shiv--;monster.hunting=false;monster.scaredUntil=state.time+14;showMsg('Заточка попала — Оно отшатнулось во тьму!');playClick();updateHUD();return;}const q=nearestInteract();if(q){useInteract(q);return;}const d=nearestDoor();if(d){useDoor(d);return;}}
function takeItem(it){state.inventory.__taken[it.id]=true;const t=it.type;if(t==='journal'){if(!state.journals.includes(it.page))state.journals.push(it.page);state.journals.sort((a,b)=>a-b);state.journalPage=state.journals[0]??0;showMsg('Найдена запись Освальда. Нажми J, чтобы читать.');}else{state.inventory[t]=(state.inventory[t]||0)+1;showMsg(`Получено: ${itemInfo[t][0]}`);}playClick();buildRoom(state.room);updateHUD();}
function useDoor(d){if(d.requires){if(d.requires==='fuel'&&(state.inventory.fuel||0)+(state.inventory.fuel2||0)<=0){showMsg('Дверь заперта. Нужен канистровый запас топлива.');return;}if(d.requires==='key'&&(state.inventory.key||0)<=0){showMsg('Нужен старый ключ.');return;}if(d.requires==='journals'&&state.journals.length<5){showMsg('Ты ещё не собрал все записи Освальда.');return;}if(d.requires==='archive'&&state.journals.length<4){showMsg('Архивная дверь не поддаётся. Сначала найди записи.');return;}}if(d.target==='ENDING'){winGame(state.health<35?'lastlight':state.journals.length===5&&roofDone?'true':'escape');return;}buildRoom(d.target);const c=cellCenter(d.sx,d.sy);player.x=c.x;player.z=c.z;state.noise=0;emitNoise(c.x,c.z,.55);resetMonsterForRoom();showMsg('Комната: '+rooms[d.target].name);}
let lanternDone=false,roofDone=false;
function useInteract(q){if(q.type==='lantern'){if(lanternDone){showMsg('Лампа уже работает.');return;}if((state.inventory.fuel||0)+(state.inventory.fuel2||0)<=0){showMsg('Нужен fuel — найди топливо в кладовой или подвале.');return;}if(state.inventory.fuel)state.inventory.fuel--;else state.inventory.fuel2--;lanternDone=true;state.battery=Math.min(100,state.battery+20);showMsg('Маяк зажжён. Теперь найди аварийный прожектор на крыше.');buildRoom(state.room);}
if(q.type==='roofLight'){if(!lanternDone){showMsg('Сначала нужно зажечь маяк.');return;}roofDone=true;showMsg('Аварийный прожектор вспыхнул. Внизу стало непривычно тихо...');buildRoom(state.room);}}
function secretRoom(){if(state.room==='secret')return;showMsg('Пол под ногами дрогнул...');setTimeout(()=>{if(state.screen!=='playing')return;buildRoom('secret');player.x=9*TILE;player.z=5*TILE;},500);state.secretBuffer='';}
function updateMonster(dt){if(!rooms[state.room].monster){if(monsterMesh)monsterMesh.visible=false;return;}if(!monster.active){monster.timer-=dt;if(monster.timer<=0){monster.active=true;monsterMesh.visible=true;monsterGlow.visible=true;}return;}const dx=player.x-monster.x,dz=player.z-monster.z,dist=Math.hypot(dx,dz);const scared=state.time<monster.scaredUntil;const lit=state.flash&&dist<7;if(lit||scared){monster.mode='flee';monster.hunting=false;const a=Math.atan2(monster.z-player.z,monster.x-player.x);const sp=scared?2.6:1.8;monster.x+=Math.cos(a)*dt*sp;monster.z+=Math.sin(a)*dt*sp;}else{const noise=state.lastNoise,noiseFresh=noise&&(state.time-noise.time)<6.5,noiseDist=noise?Math.hypot(noise.x-monster.x,noise.z-monster.z):Infinity;if(dist<3.4){if(monster.mode!=='hunt'){showMsg('Оно почуяло тебя...');playGrowl();}monster.mode='hunt';monster.hunting=true;const a=Math.atan2(dz,dx),sp=state.running?1.55:1.2;monster.x+=Math.cos(a)*dt*sp;monster.z+=Math.sin(a)*dt*sp;state.sanity-=dt*Math.max(0,4.2-dist)*3.1;}else if(noiseFresh&&noiseDist>.6){monster.mode='investigate';monster.hunting=false;const a=Math.atan2(noise.z-monster.z,noise.x-monster.x),sp=1.05;monster.x+=Math.cos(a)*dt*sp;monster.z+=Math.sin(a)*dt*sp;}else{monster.mode='idle';monster.hunting=false;monster.wanderAngle+=(Math.random()-.5)*dt*1.4;const sp=.35;monster.x+=Math.cos(monster.wanderAngle)*dt*sp;monster.z+=Math.sin(monster.wanderAngle)*dt*sp;}}if(dist<4&&!state.flash&&!scared)state.sanity-=dt*(4-dist)*2.5;if(state.sanity<100&&monster.mode!=='hunt')state.sanity+=dt*.8;if(dist<1.05&&!state.flash&&!scared){state.health-=dt*22;state.health=Math.max(0,state.health);}if(state.health<=0){death('exhausted');return;}if(state.sanity<=0){death('sanity');return;}monster.x=Math.max(TILE*1.2,Math.min(TILE*(COLS-2),monster.x));monster.z=Math.max(TILE*1.2,Math.min(TILE*(ROWS-2),monster.z));monsterMesh.position.set(monster.x,1.35,monster.z);monsterMesh.material.rotation+=dt*.15;monsterGlow.position.set(monster.x,1,monster.z);monsterGlow.intensity=.18+(monster.mode==='hunt'?.25:monster.mode==='investigate'?.12:0);const danger=Math.max(0,Math.min(1,(4-dist)/4));const de=document.getElementById('danger');de.style.boxShadow=`inset 0 0 150px 55px rgba(130,0,0,${danger*.65})`;de.classList.toggle('dangerPulse',danger>.55);}
function sanityTier(){const s=state.sanity;if(s>70)return'normal';if(s>40)return'mild';if(s>20)return'moderate';if(s>8)return'low';return'critical';}
function visualGlitch(tier){if(!renderer)return;const canvas=renderer.domElement;canvas.style.filter=tier==='critical'?'contrast(1.3) hue-rotate(15deg) blur(1px)':tier==='low'?'contrast(1.18) hue-rotate(8deg)':'contrast(1.08)';const dur=120+Math.random()*180;setTimeout(()=>{canvas.style.filter='';},dur);const jy=yaw,jp=pitch;yaw+=(Math.random()-.5)*.05;pitch+=(Math.random()-.5)*.03;setTimeout(()=>{yaw=jy;pitch=jp;},90);}
function phantomEvent(){if(state.screen!=='playing')return;const ang=Math.random()*Math.PI*2,d=3+Math.random()*4;emitNoise(player.x+Math.cos(ang)*d,player.z+Math.sin(ang)*d,.5);const kind=Math.random();if(kind<.55)playStep();else if(kind<.85)tone(140,.12,.03,'square');else showMsg('Тебе показалось, что в темноте что-то мелькнуло...');}
function doorIllusion(){if(state.screen!=='playing'||!roomGroup)return;const doors=roomGroup.children.filter(o=>o.userData?.door);if(!doors.length)return;const doorMesh=doors[Math.floor(Math.random()*doors.length)];const original=doorMesh.material;const fake=original.clone();fake.userData={};fake.map=tex('door_ending.png');fake.needsUpdate=true;doorMesh.material=fake;setTimeout(()=>{doorMesh.material=original;fake.dispose();},700+Math.random()*500);}
function triggerControlFlip(){if(state.screen!=='playing')return;state.controlsInverted=true;showMsg('Что-то не так с твоим телом...');setTimeout(()=>{state.controlsInverted=false;},3200+Math.random()*1800);}
function updateSanityEffects(dt){const tier=sanityTier();document.getElementById('canvasWrap').classList.toggle('sanityCritical',tier==='critical');if(tier!=='normal'){glitchTimer-=dt;if(glitchTimer<=0){glitchTimer=(tier==='mild'?7:tier==='moderate'?5:tier==='low'?3.5:2)+Math.random()*4;visualGlitch(tier);}}if(tier==='moderate'||tier==='low'||tier==='critical'){phantomTimer-=dt;if(phantomTimer<=0){phantomTimer=6+Math.random()*7;phantomEvent();}}if(tier==='low'||tier==='critical'){doorIllusionTimer-=dt;if(doorIllusionTimer<=0){doorIllusionTimer=9+Math.random()*9;doorIllusion();}}if(tier==='critical'){controlFlipTimer-=dt;if(controlFlipTimer<=0){controlFlipTimer=22+Math.random()*14;triggerControlFlip();}}}
function death(kind){if(state.screen!=='playing')return;state.screen='dead';clearSave();document.getElementById('hud').style.display='none';document.exitPointerLock?.();document.getElementById('deathTitle').textContent=kind==='caught'?'ОНО НАШЛО ТЕБЯ':kind==='sanity'?'РАССУДОК УГАС':'ТЫ БОЛЬШЕ НЕ МОЖЕШЬ ИДТИ';document.getElementById('deathText').textContent=INTRO[kind]||INTRO.caught;document.getElementById('death').classList.remove('hidden');stopAudio();}
function winGame(kind){if(state.won)return;state.won=true;state.screen='win';state.ending=kind;clearSave();document.exitPointerLock?.();document.getElementById('hud').style.display='none';const d=ENDINGS[kind];document.getElementById('winTitle').textContent=d[0];document.getElementById('winSub').textContent=d[1];document.getElementById('winText').textContent=d[2];document.getElementById('win').classList.remove('hidden');stopAudio();}
function updateHUD(){document.getElementById('healthFill').style.width=state.health+'%';document.getElementById('sanityFill').style.width=state.sanity+'%';document.getElementById('batteryFill').style.width=state.battery+'%';const el=document.getElementById('invHud');el.innerHTML='';['battery','fuel','key','shiv','bullets'].forEach(k=>{const n=state.inventory[k]||0;if(!n)return;const s=document.createElement('div');s.className='slot';s.innerHTML=`<img src="${iconSrc(itemInfo[k][1])}"><b>${n}</b>`;el.appendChild(s);});}
function showMsg(t){const e=document.getElementById('topMsg');e.textContent=t;e.classList.add('show');clearTimeout(actionTimer);actionTimer=setTimeout(()=>e.classList.remove('show'),2300);}
function initAudio(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=state.volume;master.connect(ctx.destination);}
function startAudio(){if(!ctx||drone.length)return;[48,55,110].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i===2?'sine':'sawtooth';o.frequency.value=f;g.gain.value=i===2?.012:.009;o.connect(g);g.connect(master);o.start();drone.push(o);});}
function stopAudio(){drone.forEach(o=>{try{o.stop()}catch(e){}});drone=[];}
function tone(freq,dur,gain=.04,type='square'){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+dur);}
function playClick(){tone(440,.05,.035)}function playStep(){tone(85+Math.random()*25,.08,.035)}function playGrowl(){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(75,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(28,ctx.currentTime+1);g.gain.value=.07;g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+1);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+1)}
function playGunshot(){initAudio();if(!ctx)return;const dur=.18,bufferSize=Math.floor(ctx.sampleRate*dur),buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<bufferSize;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/bufferSize,2);const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=buffer;g.gain.value=.35;src.connect(g);g.connect(master);src.start();tone(90,.12,.12,'square');}
function firePistol(){if((state.inventory.pistol||0)<=0){showMsg('У тебя нет оружия.');return;}if((state.inventory.bullets||0)<=0){showMsg('Патронов нет — только сухой щелчок бойка.');return;}state.inventory.bullets--;playGunshot();emitNoise(player.x,player.z,1);updateHUD();const active=rooms[state.room].monster&&monster.active;const dist=active?Math.hypot(player.x-monster.x,player.z-monster.z):Infinity;if(active&&dist<10){if(!state.gunRevealed){state.gunRevealed=true;showMsg('Пуля прошла сквозь него, будто сквозь дым. Оно даже не замедлилось.');state.sanity=Math.max(0,state.sanity-10);}else{showMsg('Бесполезно. Патрон впустую.');}}else{showMsg('Выстрел эхом разнёсся по коридорам.');}}
function openCraft(){openModal('craftModal');}
function openJournal(){if(!state.journals.length){showMsg('У тебя пока нет записей.');return;}openModal('journalModal');}
function loop(){requestAnimationFrame(loop);const dt=Math.min(.05,clock.getDelta());state.time+=dt;if(state.screen==='playing'){updatePlayer(dt);updateMonster(dt);updateSanityEffects(dt);if(roomGroup){for(const l of roomGroup.userData.flickerLights){const f=l.userData.flicker;l.intensity=f.base*(.90+.10*Math.sin(state.time*7+f.phase)+.035*Math.sin(state.time*19+f.phase));}for(const p of roomGroup.userData.dustPoints)p.rotation.y+=dt*.004;}}renderer.render(scene,camera);}
// Intro: logo appears, stays, then slowly disappears before the main menu.
function startIntro(){const i=document.getElementById('intro');setTimeout(()=>i.classList.add('showSub'),450);setTimeout(()=>{i.style.opacity='0';setTimeout(()=>{i.remove();document.getElementById('menu').classList.remove('hidden');startMenuScene();},1800);},2600);}
setupTouch();init();startIntro();
