/* ChemLab shared data + chemistry engine (no dependencies) */
window.CHEM = (function(){
  "use strict";

  /* [Z, symbol, name, atomic mass, category] */
  var E=[
  [1,"H","Hydrogen",1.008,"nonmetal"],[2,"He","Helium",4.0026,"noble"],[3,"Li","Lithium",6.94,"alkali"],[4,"Be","Beryllium",9.0122,"alkaline"],[5,"B","Boron",10.81,"metalloid"],[6,"C","Carbon",12.011,"nonmetal"],[7,"N","Nitrogen",14.007,"nonmetal"],[8,"O","Oxygen",15.999,"nonmetal"],[9,"F","Fluorine",18.998,"halogen"],[10,"Ne","Neon",20.180,"noble"],
  [11,"Na","Sodium",22.990,"alkali"],[12,"Mg","Magnesium",24.305,"alkaline"],[13,"Al","Aluminium",26.982,"post"],[14,"Si","Silicon",28.085,"metalloid"],[15,"P","Phosphorus",30.974,"nonmetal"],[16,"S","Sulfur",32.06,"nonmetal"],[17,"Cl","Chlorine",35.45,"halogen"],[18,"Ar","Argon",39.948,"noble"],[19,"K","Potassium",39.098,"alkali"],[20,"Ca","Calcium",40.078,"alkaline"],
  [21,"Sc","Scandium",44.956,"transition"],[22,"Ti","Titanium",47.867,"transition"],[23,"V","Vanadium",50.942,"transition"],[24,"Cr","Chromium",51.996,"transition"],[25,"Mn","Manganese",54.938,"transition"],[26,"Fe","Iron",55.845,"transition"],[27,"Co","Cobalt",58.933,"transition"],[28,"Ni","Nickel",58.693,"transition"],[29,"Cu","Copper",63.546,"transition"],[30,"Zn","Zinc",65.38,"transition"],
  [31,"Ga","Gallium",69.723,"post"],[32,"Ge","Germanium",72.630,"metalloid"],[33,"As","Arsenic",74.922,"metalloid"],[34,"Se","Selenium",78.971,"nonmetal"],[35,"Br","Bromine",79.904,"halogen"],[36,"Kr","Krypton",83.798,"noble"],[37,"Rb","Rubidium",85.468,"alkali"],[38,"Sr","Strontium",87.62,"alkaline"],[39,"Y","Yttrium",88.906,"transition"],[40,"Zr","Zirconium",91.224,"transition"],
  [41,"Nb","Niobium",92.906,"transition"],[42,"Mo","Molybdenum",95.95,"transition"],[43,"Tc","Technetium",98,"transition"],[44,"Ru","Ruthenium",101.07,"transition"],[45,"Rh","Rhodium",102.91,"transition"],[46,"Pd","Palladium",106.42,"transition"],[47,"Ag","Silver",107.87,"transition"],[48,"Cd","Cadmium",112.41,"transition"],[49,"In","Indium",114.82,"post"],[50,"Sn","Tin",118.71,"post"],
  [51,"Sb","Antimony",121.76,"metalloid"],[52,"Te","Tellurium",127.60,"metalloid"],[53,"I","Iodine",126.90,"halogen"],[54,"Xe","Xenon",131.29,"noble"],[55,"Cs","Caesium",132.91,"alkali"],[56,"Ba","Barium",137.33,"alkaline"],[57,"La","Lanthanum",138.91,"lanthanide"],[58,"Ce","Cerium",140.12,"lanthanide"],[59,"Pr","Praseodymium",140.91,"lanthanide"],[60,"Nd","Neodymium",144.24,"lanthanide"],
  [61,"Pm","Promethium",145,"lanthanide"],[62,"Sm","Samarium",150.36,"lanthanide"],[63,"Eu","Europium",151.96,"lanthanide"],[64,"Gd","Gadolinium",157.25,"lanthanide"],[65,"Tb","Terbium",158.93,"lanthanide"],[66,"Dy","Dysprosium",162.50,"lanthanide"],[67,"Ho","Holmium",164.93,"lanthanide"],[68,"Er","Erbium",167.26,"lanthanide"],[69,"Tm","Thulium",168.93,"lanthanide"],[70,"Yb","Ytterbium",173.05,"lanthanide"],
  [71,"Lu","Lutetium",174.97,"lanthanide"],[72,"Hf","Hafnium",178.49,"transition"],[73,"Ta","Tantalum",180.95,"transition"],[74,"W","Tungsten",183.84,"transition"],[75,"Re","Rhenium",186.21,"transition"],[76,"Os","Osmium",190.23,"transition"],[77,"Ir","Iridium",192.22,"transition"],[78,"Pt","Platinum",195.08,"transition"],[79,"Au","Gold",196.97,"transition"],[80,"Hg","Mercury",200.59,"transition"],
  [81,"Tl","Thallium",204.38,"post"],[82,"Pb","Lead",207.2,"post"],[83,"Bi","Bismuth",208.98,"post"],[84,"Po","Polonium",209,"post"],[85,"At","Astatine",210,"halogen"],[86,"Rn","Radon",222,"noble"],[87,"Fr","Francium",223,"alkali"],[88,"Ra","Radium",226,"alkaline"],[89,"Ac","Actinium",227,"actinide"],[90,"Th","Thorium",232.04,"actinide"],
  [91,"Pa","Protactinium",231.04,"actinide"],[92,"U","Uranium",238.03,"actinide"],[93,"Np","Neptunium",237,"actinide"],[94,"Pu","Plutonium",244,"actinide"],[95,"Am","Americium",243,"actinide"],[96,"Cm","Curium",247,"actinide"],[97,"Bk","Berkelium",247,"actinide"],[98,"Cf","Californium",251,"actinide"],[99,"Es","Einsteinium",252,"actinide"],[100,"Fm","Fermium",257,"actinide"],
  [101,"Md","Mendelevium",258,"actinide"],[102,"No","Nobelium",259,"actinide"],[103,"Lr","Lawrencium",266,"actinide"],[104,"Rf","Rutherfordium",267,"transition"],[105,"Db","Dubnium",268,"transition"],[106,"Sg","Seaborgium",269,"transition"],[107,"Bh","Bohrium",270,"transition"],[108,"Hs","Hassium",269,"transition"],[109,"Mt","Meitnerium",278,"transition"],[110,"Ds","Darmstadtium",281,"transition"],
  [111,"Rg","Roentgenium",282,"transition"],[112,"Cn","Copernicium",285,"transition"],[113,"Nh","Nihonium",286,"post"],[114,"Fl","Flerovium",289,"post"],[115,"Mc","Moscovium",290,"post"],[116,"Lv","Livermorium",293,"post"],[117,"Ts","Tennessine",294,"halogen"],[118,"Og","Oganesson",294,"noble"]];

  /* extra facts: [EN, ionization kJ/mol, density g/cm3, melt C, boil C, year, discoverer, ions, uses, hazards] */
  var X={
    H:[2.20,1312,0.00009,-259,-253,1766,"Henry Cavendish","H+, H-","Fuel cells, ammonia","Flammable, explosion risk"],
    He:[null,2372,0.00018,-272,-269,1868,"Pierre Janssen",null,"Balloons, cooling","Non-toxic, asphyxiant"],
    Li:[0.98,520,0.534,181,1342,1817,"Johan Arfwedson","Li+","Batteries, alloys","Reacts with water"],
    C:[2.55,1086,2.267,3550,4027,"ancient","—","C4-, C4+","Steel, diamonds, life","CO is toxic"],
    N:[3.04,1402,0.00125,-210,-196,1772,"Daniel Rutherford","N3-","Fertilizer","Asphyxiant; NO2 toxic"],
    O:[3.44,1314,0.00143,-218,-183,1774,"Carl Wilhelm Scheele","O2-","Breathing, steel","Supports combustion"],
    Na:[0.93,496,0.971,98,883,1807,"Humphry Davy","Na+","Salt, lights","Reacts violently with water"],
    Mg:[1.31,738,1.738,650,1090,1755,"Joseph Black","Mg2+","Alloys, flares","Flammable"],
    Al:[1.61,578,2.70,660,2519,1825,"H. C. Oersted","Al3+","Aircraft, cans","Dust explosive"],
    Si:[1.90,787,2.33,1414,3265,1824,"J. J. Berzelius","Si4-","Chips, glass","Dust irritates lungs"],
    P:[2.19,1012,1.823,44,280,1669,"Hennig Brand","P3-, P5+","Fertilizer, matches","White P is toxic"],
    S:[2.58,1000,2.07,115,444,"ancient","—","S2-","Acid, rubber","SO2 irritates lungs"],
    Cl:[3.16,1251,0.0032,-102,-34,1774,"C. W. Scheele","Cl-","Disinfectant, PVC","Toxic gas"],
    Ar:[null,1521,0.0018,-189,-186,1894,"Lord Rayleigh","—","Welding, bulbs","Asphyxiant"],
    K:[0.82,419,0.862,63,759,1807,"Humphry Davy","K+","Fertilizer, nerves","Reacts violently with water"],
    Ca:[1.00,590,1.55,842,1484,1808,"Humphry Davy","Ca2+","Bones, cement","Reacts with water"],
    Fe:[1.83,762,7.874,1538,2861,"ancient","—","Fe2+, Fe3+","Steel, blood (heme)","Rusts; dust ignites"],
    Cu:[1.90,745,8.96,1085,2562,"ancient","—","Cu+, Cu2+","Wiring, coins","Toxic in excess"],
    Zn:[1.65,906,7.134,420,907,"ancient","—","Zn2+","Galvanizing","Metal-fume fever"],
    Ag:[1.93,731,10.49,962,2162,"ancient","—","Ag+","Jewelry, electronics","Argyria"],
    Sn:[1.96,709,7.31,232,2603,"ancient","—","Sn2+, Sn4+","Solder, cans","Organotins toxic"],
    I:[2.66,1008,4.93,114,184,1811,"Bernard Courtois","I-","Antiseptic, thyroid","Vapour irritates lungs"],
    Au:[2.54,890,19.30,1064,2856,"ancient","—","Au+, Au3+","Jewelry, electronics","Non-toxic as metal"],
    Hg:[2.00,1007,13.534,-39,357,"ancient","—","Hg22+, Hg2+","Thermometers, lamps","Neurotoxin"],
    Pb:[2.33,716,11.34,327,1749,"ancient","—","Pb2+, Pb4+","Batteries, shielding","Neurotoxin"],
    U:[1.38,597,19.05,1132,4131,1789,"Martin Klaproth","U3+, U4+, U6+","Nuclear fuel","Radioactive"]
  };
  var CATNAME={alkali:"Alkali metal",alkaline:"Alkaline earth",transition:"Transition metal",post:"Post-transition",metalloid:"Metalloid",nonmetal:"Nonmetal",halogen:"Halogen",noble:"Noble gas",lanthanide:"Lanthanide",actinide:"Actinide"};
  var GASES={H:1,He:1,N:1,O:1,F:1,Ne:1,Cl:1,Ar:1,Kr:1,Xe:1,Rn:1}, LIQ={Br:1,Hg:1};
  var AUFBAU=["1s","2s","2p","3s","3p","4s","3d","4p","5s","4d","5p","6s","4f","5d","6p","7s","5f","6d","7p"];
  var CAP={s:2,p:6,d:10,f:14};

  function config(z){ var left=z,out=[]; for(var i=0;i<AUFBAU.length&&left>0;i++){ var sub=AUFBAU[i],cap=CAP[sub[1]],take=Math.min(cap,left); out.push(sub+take); left-=take; } return out; }
  function shells(cfg){ var s={}; cfg.forEach(function(p){ var n=+p[0]; s[n]=(s[n]||0)+(+p.match(/\d+$/)[0]); }); return Object.keys(s).map(function(k){return s[k]}); }
  function pos(z){
    if(z===1)return[1,1]; if(z===2)return[18,1];
    if(z<=4)return[z-2+1,2]; if(z<=10)return[z-10+13,2];
    if(z<=12)return[z-12+1,3]; if(z<=18)return[z-18+13,3];
    if(z<=36){var r=Math.floor((z-19)/18)+4,c=(z-19)%18+1;return[c,r]}
    if(z<=54){var r2=Math.floor((z-37)/18)+5,c2=(z-37)%18+1;return[c2,r2]}
    if(z<=56)return[z-55+1,6];
    if(z<=71)return[z-57+4,9];
    if(z<=86){var r3=Math.floor((z-72)/18)+6,c3=(z-72)%18+1;return[c3,r3]}
    if(z<=88)return[z-87+1,7];
    if(z<=103)return[z-89+4,10];
    var r4=Math.floor((z-104)/18)+7,c4=(z-104)%18+1;return[c4,r4];
  }
  function byZ(z){ for(var i=0;i<E.length;i++) if(E[i][0]===z) return E[i]; return null; }
  function bySym(s){ for(var i=0;i<E.length;i++) if(E[i][1]===s) return E[i]; return null; }
  function phase(sym){ return GASES[sym]?"Gas":LIQ[sym]?"Liquid":"Solid"; }
  function mass(sym){ var e=bySym(sym); return e?e[3]:0; }

  /* ---------- formula parsing + molar mass ---------- */
  function parseFormula(f){
    f=String(f).replace(/\s+/g,"");
    if(!f) throw new Error("empty");
    var i=0;
    function readNum(){ var s=""; while(i<f.length&&/[0-9]/.test(f[i])){ s+=f[i]; i++; } return s?parseInt(s,10):1; }
    function add(dst,src,m){ for(var k in src) dst[k]=(dst[k]||0)+src[k]*m; }
    function group(){
      var counts={};
      while(i<f.length){
        var c=f[i];
        if(c==="("){ i++; var sub=group(); if(f[i]!==")") throw new Error("missing )"); i++; add(counts,sub,readNum()); }
        else if(c===")"){ return counts; }
        else if(/[A-Z]/.test(c)){ var sym=c; i++; if(f[i]&&/[a-z]/.test(f[i])){ sym+=f[i]; i++; } if(!bySym(sym)) throw new Error("unknown element "+sym); add(counts,{[sym]:1},readNum()); }
        else throw new Error("unexpected '"+c+"'");
      }
      return counts;
    }
    var out=group(); if(i!==f.length) throw new Error("bad formula"); return out;
  }
  function molarMass(f){
    var counts=parseFormula(f), total=0, parts=[];
    Object.keys(counts).forEach(function(s){ var m=counts[s]*mass(s); total+=m; parts.push({el:s,n:counts[s],mass:m}); });
    return {total:total, parts:parts};
  }

  /* ---------- equation balancer ---------- */
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t}return a||1}
  function fr(n,d){d=d==null?1:d;if(d<0){n=-n;d=-d}var g=gcd(n,d);return{n:n/g,d:d/g}}
  function fadd(a,b){return fr(a.n*b.d+b.n*a.d,a.d*b.d)}
  function fsub(a,b){return fr(a.n*b.d-b.n*a.d,a.d*b.d)}
  function fmul(a,b){return fr(a.n*b.n,a.d*b.d)}
  function fdiv(a,b){return fr(a.n*b.d,a.d*b.n)}
  function balance(left,right){
    var species=left.concat(right), elems={};
    species.forEach(function(s){ Object.keys(parseFormula(s)).forEach(function(k){elems[k]=1}) });
    var ekeys=Object.keys(elems);
    var A=ekeys.map(function(el){ return species.map(function(s,idx){ return fr(idx<left.length?(parseFormula(s)[el]||0):-(parseFormula(s)[el]||0),1); }); });
    var m=A.length,n=species.length,piv=[],r=0;
    for(var col=0;col<n&&r<m;col++){
      var sel=-1; for(var rr=r;rr<m;rr++) if(A[rr][col].n!==0){sel=rr;break}
      if(sel<0) continue;
      var tmp=A[r];A[r]=A[sel];A[sel]=tmp;
      var pv=A[r][col]; for(var cc=0;cc<n;cc++) A[r][cc]=fdiv(A[r][cc],pv);
      for(var rr2=0;rr2<m;rr2++){ if(rr2!==r&&A[rr2][col].n!==0){ var f=A[rr2][col]; for(var cc2=0;cc2<n;cc2++) A[rr2][cc2]=fsub(A[rr2][cc2],fmul(f,A[r][cc2])); } }
      piv.push(col); r++;
    }
    var free=[]; for(var c2=0;c2<n;c2++) if(piv.indexOf(c2)<0) free.push(c2);
    if(!free.length) return null;
    var fv=free[0], x=new Array(n); x[fv]=fr(1,1);
    for(var pi=0;pi<piv.length;pi++){ var pc=piv[pi]; x[pc]=fr(-A[pi][fv].n,A[pi][fv].d); }
    var lcm=1; x.forEach(function(v){ if(v) lcm=lcm*v.d/gcd(lcm,v.d) });
    var ints=x.map(function(v){ return v?Math.round(v.n*(lcm/v.d)):0 });
    var g=0; ints.forEach(function(v){g=gcd(g,v)}); if(g) ints=ints.map(function(v){return v/g});
    if(ints.some(function(v){return v<0})) ints=ints.map(function(v){return -v});
    return ints;
  }
  function fmtSide(species,coefs,off){ return species.map(function(s,i){ var c=coefs[off+i]; return (c===1?"":c)+s; }).join(" + "); }
  function balanceEq(str){
    var p=str.split(/->|=>|=|→/); if(p.length!==2) return null;
    var left=p[0].split("+").map(function(s){return s.trim()}).filter(Boolean);
    var right=p[1].split("+").map(function(s){return s.trim()}).filter(Boolean);
    if(!left.length||!right.length) return null;
    var c=balance(left,right); if(!c) return null;
    return fmtSide(left,c,0)+" → "+fmtSide(right,c,left.length);
  }
  var REACTIONS=[
    {eq:"H2 + O2 -> H2O",d:"easy"},{eq:"Na + Cl2 -> NaCl",d:"easy"},{eq:"Mg + O2 -> MgO",d:"easy"},
    {eq:"KClO3 -> KCl + O2",d:"medium"},{eq:"Fe + O2 -> Fe2O3",d:"medium"},{eq:"CaCO3 -> CaO + CO2",d:"easy"},
    {eq:"Al + HCl -> AlCl3 + H2",d:"medium"},{eq:"CH4 + O2 -> CO2 + H2O",d:"medium"},{eq:"Na + H2O -> NaOH + H2",d:"medium"},
    {eq:"C3H8 + O2 -> CO2 + H2O",d:"hard"},{eq:"Fe2O3 + CO -> Fe + CO2",d:"hard"},{eq:"KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2",d:"hard"},
    {eq:"NH3 + O2 -> NO + H2O",d:"hard"},{eq:"Pb(NO3)2 + KI -> PbI2 + KNO3",d:"medium"},{eq:"Zn + HCl -> ZnCl2 + H2",d:"easy"},
    {eq:"AgNO3 + NaCl -> AgCl + NaNO3",d:"easy"},{eq:"Cu + AgNO3 -> Cu(NO3)2 + Ag",d:"medium"},{eq:"H2SO4 + NaOH -> Na2SO4 + H2O",d:"medium"},
    {eq:"C2H6 + O2 -> CO2 + H2O",d:"hard"},{eq:"BaCl2 + Na2SO4 -> BaSO4 + NaCl",d:"easy"}
  ];

  /* ---------- molecule presets (3D) ---------- */
  function ring(n,r){ var a=[],i; for(i=0;i<n;i++){ var t=i*2*Math.PI/n; a.push([Math.cos(t)*r,Math.sin(t)*r,0]); } return a; }
  var MOL={
    "Water — H2O": {a:[["O",0,0,0],["H",0.757,0.586,0],["H",-0.757,0.586,0]],b:[[0,1],[0,2]]},
    "Methane — CH4": {a:[["C",0,0,0],["H",0.63,0.63,0.63],["H",-0.63,-0.63,0.63],["H",-0.63,0.63,-0.63],["H",0.63,-0.63,-0.63]],b:[[0,1],[0,2],[0,3],[0,4]]},
    "Ammonia — NH3": {a:[["N",0,0.25,0],["H",0.94,-0.28,0],["H",-0.47,-0.28,0.81],["H",-0.47,-0.28,-0.81]],b:[[0,1],[0,2],[0,3]]},
    "Carbon dioxide — CO2": {a:[["C",0,0,0],["O",1.16,0,0],["O",-1.16,0,0]],b:[[0,1],[0,2]]},
    "Ethene — C2H4": {a:[["C",0.67,0,0],["C",-0.67,0,0],["H",1.24,0.93,0],["H",1.24,-0.93,0],["H",-1.24,0.93,0],["H",-1.24,-0.93,0]],b:[[0,1],[0,2],[0,3],[1,4],[1,5]]},
    "Benzene — C6H6": {a:[].concat(ring(6,1.39).map(function(p){return ["C"].concat(p)}), ring(6,2.48).map(function(p){return ["H"].concat(p)})), b:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]]},
    "Ethanol — C2H5OH": {a:[["C",-0.8,-0.25,0],["C",0.6,0.4,0],["O",1.7,-0.4,0],["H",-1.3,-1.1,0.4],["H",-1.3,-0.5,-0.9],["H",-1.1,0.6,0.5],["H",1.1,1.2,0.3],["H",0.5,0.9,-0.9],["H",2.4,-0.1,0]],b:[[0,1],[1,2],[0,3],[0,4],[0,5],[1,6],[1,7],[2,8]]},
    "Oxygen — O2": {a:[["O",0.6,0,0],["O",-0.6,0,0]],b:[[0,1]]},
    "Nitrogen — N2": {a:[["N",0.55,0,0],["N",-0.55,0,0]],b:[[0,1]]},
    "Hydrogen chloride — HCl": {a:[["H",-0.64,0,0],["Cl",0.64,0,0]],b:[[0,1]]},
    "Sodium chloride — NaCl": {a:[["Na",0,0,0],["Cl",2.36,0,0]],b:[[0,1]]},
    "Sulfur dioxide — SO2": {a:[["S",0,0.3,0],["O",1.2,-0.3,0],["O",-1.2,-0.3,0]],b:[[0,1],[0,2]]},
    "Hydrogen peroxide — H2O2": {a:[["O",-0.7,0.2,0],["O",0.7,-0.2,0],["H",-1.2,0.9,0.4],["H",1.2,-0.9,-0.4]],b:[[0,1],[0,2],[1,3]]}
  };

  /* ---------- UI helpers ---------- */
  function toast(msg){ var t=document.getElementById("toast"); if(!t) return; t.textContent=msg; t.classList.add("on"); setTimeout(function(){t.classList.remove("on")},1600); }
  function nav(active){
    var tabs=[["index.html","Home","home"],["table.html","Periodic Table","table"],["tools.html","Tools","tools"],["lab.html","3D Lab","lab"],["trends.html","Trends","trends"],["worksheet.html","Worksheet","worksheet"],["flashcards.html","Flashcards","flashcards"]];
    return tabs.map(function(t){ return '<a href="'+t[0]+'"'+(t[2]===active?' class="on"':'')+'>'+t[1]+'</a>'; }).join("");
  }
  function header(active){
    return '<header><a class="logo" href="index.html">Cl</a><h1><a href="index.html">Chem<span>Lab</span></a></h1>'+
      '<span class="sub">periodic table · atoms · tools · worksheets</span></header>'+
      '<nav>'+nav(active)+'</nav>';
  }
  function mount(active){
    var h=document.getElementById("shell");
    if(h) h.innerHTML=header(active);
    // the hidden door: type 9999
    var buf="";
    document.addEventListener("keydown",function(e){
      if(e.key>="0"&&e.key<="9"){ buf=(buf+e.key).slice(-4); if(buf==="9999") window.location.href="../index.html"; }
      else if(e.key.length===1){ buf=""; }
    });
  }

  return { E:E, X:X, CATNAME:CATNAME, GASES:GASES, LIQ:LIQ, MOL:MOL, REACTIONS:REACTIONS,
    config:config, shells:shells, pos:pos, byZ:byZ, bySym:bySym, phase:phase, mass:mass,
    parseFormula:parseFormula, molarMass:molarMass, balance:balance, balanceEq:balanceEq, fmtSide:fmtSide,
    toast:toast, mount:mount, header:header };
})();