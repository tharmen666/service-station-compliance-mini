import type { Lang } from "./types";

export type L3 = { en: string; sw: string; rw: string };

export const tr = (v: L3, lang: Lang | "en"): string => {
  if (lang === "sw") return v.sw;
  if (lang === "rw") return v.rw;
  return v.en;
};

export interface Drill {
  id: string;
  title: L3;
  authorities: "tanker" | "spill" | "evacuation" | "customer" | "firstaid";
  steps: L3[];
}

export const DRILLS: Drill[] = [
  {
    id: "tanker",
    title: {
      en: "Depot tanker delivery & offloading (8 steps)",
      sw: "Kupokea na kupakua tanka ya mafuta (hatua 8)",
      rw: "Kwakira no gupakurura ikamyo y'ibikomoka kuri peteroli (intambwe 8)",
    },
    authorities: "tanker",
    steps: [
      { en: "Connect earthing/bonding cable to tanker and station earth point before opening any hatch.", sw: "Unganisha kebo ya kuweka ardhi kwenye tanka na sehemu ya ardhi ya kituo kabla ya kufungua mfuniko wowote.", rw: "Shyiramo umugozi wo gusangira amashanyarazi ku kamyo no ku nsinga y'ubutaka bw'ikigo mbere yo gufungura umupfundikizo." },
      { en: "Stage fire extinguishers within reach at the offloading point.", sw: "Weka vizima moto karibu na eneo la kupakua.", rw: "Shyira ibizimya-muriro hafi y'aho bapakurura." },
      { en: "Verify product grade matches the tank label (PMS, AGO or IK).", sw: "Thibitisha aina ya mafuta inalingana na lebo ya tanki (PMS, AGO au IK).", rw: "Genzura ko ubwoko bw'ibikomoka buhuye n'ikirango cy'ikigega (PMS, AGO cyangwa IK)." },
      { en: "Check the Omnicomm waybill against the delivery docket and dispatch volume (L).", sw: "Linganisha waybill ya Omnicomm na hati ya usafirishaji na kiasi (L).", rw: "Gereranya waybill ya Omnicomm n'inyandiko y'umuzigo n'ingano yoherejwe (L)." },
      { en: "Take the pre-drop wooden dipstick reading (cm) and convert to litres.", sw: "Pima kwa fimbo ya mbao kabla ya kushusha mafuta (cm) kisha badilisha kuwa lita.", rw: "Pima ukoresheje ikibabi cy'imbaho mbere yo gupfundura (cm) uhindure mo litiro." },
      { en: "Confirm ullage (empty space) is enough for the delivery volume.", sw: "Hakikisha nafasi tupu inatosha kwa kiasi cha mzigo.", rw: "Emeza ko umwanya uhari uhagije ingano y'umuzigo." },
      { en: "Let the product settle, then take the post-drop dip and record it.", sw: "Acha mafuta yatulie, kisha pima baada ya kupakua na urekodi.", rw: "Reka ibikomoka bihame, hanyuma upime nyuma yo gupfundura maze ubyandike." },
      { en: "Sign the delivery docket with the driver and supervisor; the record is written to the ledger.", sw: "Saini hati ya usafirishaji pamoja na dereva na msimamizi; rekodi inaingia kwenye daftari.", rw: "Shyiraho umukono ku nyandiko hamwe n'umushoferi n'umugenzuzi; ibyanditswe bijya muri ledger." },
    ],
  },
  {
    id: "spill",
    title: {
      en: "Emergency fuel spill response (8 steps)",
      sw: "Kukabiliana na kumwagika kwa mafuta (hatua 8)",
      rw: "Gukemura impanuka yo kumeneka kw'ibikomoka (intambwe 8)",
    },
    authorities: "spill",
    steps: [
      { en: "Hit the Emergency Shut-Off (ESD) to stop all pumps.", sw: "Bonyeza ESD kusimamisha pampu zote.", rw: "Kanda ESD uhagarike amapompo yose." },
      { en: "Remove or eliminate ignition sources: no phones, no engines, no smoking.", sw: "Ondoa vyanzo vya moto: hakuna simu, injini wala sigara.", rw: "Kuraho ibishobora gutera umuriro: nta telefone, moteri cyangwa itabi." },
      { en: "Isolate and barricade the zone. Keep people upwind.", sw: "Funga eneo na weka kizuizi. Watu wakae upande wa upepo.", rw: "Fungira ahantu hose hacyekwa kandi uhagarike abantu ku ruhande rw'umuyaga." },
      { en: "Contain with booms or absorbent sand. NEVER wash fuel into storm drains.", sw: "Zuia kwa boya au mchanga wa kufyonza. USIOSHE mafuta kwenye mifereji ya mvua.", rw: "Fata ukoresheje imitego cyangwa umucanga ukurura. NTUKIMESEREHO mu miyoboro y'amazi y'imvura." },
      { en: "Don PPE: gloves, boots, goggles, and respirator if vapour is present.", sw: "Vaa PPE: glavu, buti, miwani, na kifaa cha kupumua ikiwa kuna mvuke.", rw: "Wambare PPE: amakoti y'intoki, inkweto, ibirahure, n'icyuma gihumeka niba hari umwuka." },
      { en: "Recover liquid and contaminated sand into labelled drums.", sw: "Kusanya mafuta na mchanga uliochafuka kwenye mapipa yenye lebo.", rw: "Kusanya amazi n'umucanga wanduye mu bigega bifite ikirango." },
      { en: "Notify the supervisor and emergency services if the spill is large or near water.", sw: "Mjulishe msimamizi na huduma za dharura ikiwa kumwagika ni kubwa au karibu na maji.", rw: "Menyesha umugenzuzi na serivisi z'ihutirwa niba ari kinini cyangwa hafi y'amazi." },
      { en: "Log the incident and report to the statutory environmental authority.", sw: "Andika tukio na uripoti kwa mamlaka ya mazingira.", rw: "Andika impanuka unayitangarize urwego rushinzwe ibidukikije." },
    ],
  },
  {
    id: "evacuation",
    title: {
      en: "Forecourt emergency evacuation (9 steps)",
      sw: "Kuhamisha watu kwa dharura kituoni (hatua 9)",
      rw: "Gukura abantu mu kibuga mu gihe cy'ihutirwa (intambwe 9)",
    },
    authorities: "evacuation",
    steps: [
      { en: "Sound the alarm and trigger ESD.", sw: "Piga kengele na uwashe ESD.", rw: "Vuza icyuma cy'impuruza ukoreshe ESD." },
      { en: "Halt all vehicles and pumps.", sw: "Simamisha magari yote na pampu zote.", rw: "Hagarika imodoka zose n'amapompo." },
      { en: "Guide customers upwind to the assembly point.", sw: "Waelekeze wateja upande wa upepo hadi sehemu ya kukusanyika.", rw: "Ayobora abakiriya ku muyaga bajye aho bateraniye." },
      { en: "Account for every staff member and visitor.", sw: "Hesabu kila mfanyakazi na mgeni.", rw: "Bara buri mukozi n'umushyitsi wese." },
      { en: "Call emergency services and the fire brigade.", sw: "Piga simu huduma za dharura na zima moto.", rw: "Hamagara serivisi z'ihutirwa n'abashinzwe kuzimya umuriro." },
      { en: "Notify statutory authorities for your country (see Settings).", sw: "Arifu mamlaka za kisheria za nchi yako (angalia Mipangilio).", rw: "Menyesha inzego z'amategeko z'igihugu cyawe (reba Igenamiterere)." },
      { en: "Secure the perimeter. No re-entry until cleared by the fire officer.", sw: "Linda mzunguko. Hakuna kuingia tena hadi afisa wa zima moto aruhusu.", rw: "Rinda uruzitiro. Nta gusubira imbere kugeza umuyobozi w'abashinzwe umuriro abyemeye." },
      { en: "Do not restart pumps until a supervisor signs the all-clear.", sw: "Usiwashe pampu hadi msimamizi asaini kuruhusu.", rw: "Ntugarure amapompo kugeza umugenzuzi asinye ko ari byiza." },
      { en: "Record the event in the ledger with times and headcount.", sw: "Rekodi tukio kwenye daftari pamoja na nyakati na idadi ya watu.", rw: "Andika ibyabaye muri ledger hamwe n'ibihe n'umubare w'abantu." },
    ],
  },
  {
    id: "customer",
    title: {
      en: "Customer service standard (7 steps)",
      sw: "Kiwango cha huduma kwa wateja (hatua 7)",
      rw: "Amahame y'serivisi ku bakiriya (intambwe 7)",
    },
    authorities: "customer",
    steps: [
      { en: "Greet the customer within 5 seconds.", sw: "Salimia mteja ndani ya sekunde 5.", rw: "Ramutsa umukiriya mu masegonda 5." },
      { en: "Safety check: engine off, no smoking, no phone use at the pump.", sw: "Ukaguzi wa usalama: injini zimezimwa, hakuna sigara, hakuna simu kwenye pampu.", rw: "Kugenzura umutekano: moteri izimye, nta itabi, nta telefone ku ipompo." },
      { en: "Confirm fuel grade and amount with the customer.", sw: "Thibitisha aina ya mafuta na kiasi na mteja.", rw: "Emeza ubwoko n'ingano y'ibikomoka n'umukiriya." },
      { en: "Show the meter at zero before dispensing.", sw: "Onyesha mita ikiwa sifuri kabla ya kuuza.", rw: "Erekana metero ku zeru mbere yo gutanga." },
      { en: "Offer a windscreen, tyre and oil check.", sw: "Toa huduma ya kukagua kioo, matairi na mafuta ya injini.", rw: "Tanga kugenzura ikirahure, amapine n'amavuta ya moteri." },
      { en: "Take payment and verify the receipt with the customer.", sw: "Pokea malipo na thibitisha risiti na mteja.", rw: "Akira ishyura kandi wemeze fagitire n'umukiriya." },
      { en: "Guide the customer out safely.", sw: "Mwelekeze mteja atoke salama.", rw: "Yobora umukiriya asohoke amahoro." },
    ],
  },
  {
    id: "firstaid",
    title: {
      en: "First responder basic first aid (4 scenarios)",
      sw: "Huduma ya kwanza kwa mwokozi wa awali (visa 4)",
      rw: "Ubufasha bw'ibanze ku mutabazi wa mbere (ibibazo 4)",
    },
    authorities: "firstaid",
    steps: [
      { en: "Severe cuts: apply direct pressure, elevate the limb, clean dressing, check for shock.", sw: "Majeraha makali: bonyeza moja kwa moja, inua kiungo, weka bandeji safi, angalia mshtuko.", rw: "Gukomereka gukomeye: kanda ahakomeretse, zamura ingingo, shyiramo bande isukuye, reba ko hari ihungabana." },
      { en: "Burns from heat or fuel: cool running water for 20 minutes. Remove tight items. NEVER apply butter or oil. Cover with a sterile, non-fluffy dressing.", sw: "Kuungua kwa moto au mafuta: tumia maji baridi yanayotiririka dakika 20. Ondoa vitu vya kubana. USIWEKE siagi wala mafuta. Funika kwa bandeji tasa isiyo na pamba.", rw: "Gutwikwa n'umuriro cyangwa ibikomoka: koza amazi akonje iminota 20. Kuraho ibikubana. NTUSIGE amavuta. Pfuka mu bande idafite ubwoya." },
      { en: "Choking: give 5 back blows, then 5 abdominal thrusts (Heimlich). Repeat until the object clears.", sw: "Kukwama koo: piga mgongoni mara 5, kisha bonyeza tumbo mara 5 (Heimlich). Rudia hadi kitu kitoke.", rw: "Guherwa: kubita mu mugongo inshuro 5, hanyuma gusunika inda inshuro 5 (Heimlich). Subiramo kugeza ikintu gisohotse." },
      { en: "Suspected heart attack or stroke: check FAST (Face, Arms, Speech, Time). Seat the person, loosen tight clothing, call an ambulance immediately, be ready for CPR.", sw: "Shaka ya mshtuko wa moyo au kiharusi: kagua FAST (Uso, Mikono, Usemi, Muda). Mketishe, legeza nguo, piga ambulansi mara moja, uwe tayari kwa CPR.", rw: "Gukekwa umutima cyangwa inkorora y'ubwonko: reba FAST (Mu maso, Amaboko, Kuvuga, Igihe). Icara umuntu, furura imyenda, hamagara ambulance ako kanya, witegure CPR." },
    ],
  },
];

export interface Slide {
  title: L3;
  bullets: L3[];
}

export const SLIDES: Slide[] = [
  {
    title: { en: "Why wetstock & wooden dipsticks matter", sw: "Kwa nini wetstock na fimbo za mbao ni muhimu", rw: "Impamvu wetstock n'ibikoresho by'imbaho ari ngombwa" },
    bullets: [
      { en: "Tanks are 15–20 years old. Leaks start quietly.", sw: "Matangi yana miaka 15–20. Uvujaji huanza kimya kimya.", rw: "Ibigega bimaze imyaka 15–20. Gucumbagira gutangirira ubucece." },
      { en: "Daily wetstock catches shrinkage and drive-offs early.", sw: "Wetstock ya kila siku inaonyesha upotevu mapema.", rw: "Wetstock ya buri munsi ifata igihombo hakiri kare." },
      { en: "Use calibrated wooden dipsticks only.", sw: "Tumia fimbo za mbao zilizopimwa pekee.", rw: "Koresha ibikoresho by'imbaho bipimwe gusa." },
    ],
  },
  {
    title: { en: "How to measure with a wooden dipstick", sw: "Jinsi ya kupima kwa fimbo ya mbao", rw: "Uko wapima ukoresheje ikibabi cy'imbaho" },
    bullets: [
      { en: "Read the wet mark in centimetres.", sw: "Soma alama ya unyevu kwa sentimita.", rw: "Soma ikimenyetso cy'amazi mu santimetero." },
      { en: "Add the water-paste reading if water is present.", sw: "Ongeza kipimo cha maji ikiwa maji yapo.", rw: "Ongeraho ipimwa ry'amazi niba ahari." },
      { en: "The app converts cm to litres. Check, then lock.", sw: "Programu inabadilisha cm kuwa lita. Kagua, kisha funga.", rw: "Porogaramu ihindura cm mo litiro. Genzura, hanyuma ufunge." },
    ],
  },
  {
    title: { en: "Running a shift open & close in 3 minutes", sw: "Kufungua na kufunga zamu kwa dakika 3", rw: "Gufungura no gufunga akazi mu minota 3" },
    bullets: [
      { en: "Opening stock comes from the last verified closing dip.", sw: "Stoku ya mwanzo inatoka kwenye kipimo cha mwisho kilichothibitishwa.", rw: "Ububiko bwatangiranye buva ku ipimwa riheruka ryemejwe." },
      { en: "Record meters per nozzle at open and close.", sw: "Rekodi mita kwa kila pua mwanzoni na mwishoni.", rw: "Andika metero ku muyoboro wose itangira n'iherezo." },
      { en: "Enter cash, mobile money and card totals. Sign off.", sw: "Ingiza jumla ya fedha, pesa za simu na kadi. Saini.", rw: "Shyiramo amafaranga, telefone na amakarita. Sinya." },
    ],
  },
  {
    title: { en: "Understanding variance locks & cash-up accountability", sw: "Kuelewa kufuli za tofauti na uwajibikaji wa fedha", rw: "Gusobanukirwa gufunga itandukaniro n'inshingano z'amafaranga" },
    bullets: [
      { en: "A variance over tolerance locks the shift automatically.", sw: "Tofauti kubwa kuliko ukomo inafunga zamu kiotomatiki.", rw: "Itandukaniro rirenze ihame rifunga akazi ubwikora." },
      { en: "A root cause must be written and signed by a supervisor.", sw: "Chanzo lazima kiandikwe na kusainiwa na msimamizi.", rw: "Intandaro igomba kwandikwa no gusinywa n'umugenzuzi." },
      { en: "Cash shortfalls are investigated the same way.", sw: "Upungufu wa fedha unachunguzwa vivyo hivyo.", rw: "Ibura ry'amafaranga rirakurikiranwa kimwe." },
    ],
  },
  {
    title: { en: "Safe tanker offloading checklist", sw: "Orodha salama ya kupakua tanka", rw: "Urutonde rw'umutekano wo gupakurura ikamyo" },
    bullets: [
      { en: "Bond the tanker first. Stage extinguishers.", sw: "Unganisha tanka kwanza. Weka vizima moto.", rw: "Banza usangire ikamyo. Shyira ibizimya-muriro." },
      { en: "Match Omnicomm dispatch volume to the waybill.", sw: "Linganisha kiasi cha Omnicomm na waybill.", rw: "Huza ingano ya Omnicomm na waybill." },
      { en: "Pre-drop and post-drop dips feed the reconciliation.", sw: "Vipimo kabla na baada ya kupakua vinaingia kwenye hesabu.", rw: "Ipimwa mbere n'nyuma yo gupakurura rijya mu ibarura." },
    ],
  },
  {
    title: { en: "Spill response & evacuation drills", sw: "Mazoezi ya kumwagika na kuhama kwa dharura", rw: "Imyitozo yo kumeneka n'gukura abantu mu kaga" },
    bullets: [
      { en: "ESD first. Remove ignition. Contain. Never wash to drains.", sw: "ESD kwanza. Ondoa moto. Zuia. Usioshe kwenye mifereji.", rw: "ESD mbere. Kuraho umuriro. Fata. Ntukameseho mu miyoboro." },
      { en: "Upwind assembly. Count every person.", sw: "Kusanyikia upande wa upepo. Hesabu kila mtu.", rw: "Teranira ku muyaga. Bara buri muntu." },
      { en: "Practise both drills every quarter.", sw: "Fanya mazoezi yote kila robo mwaka.", rw: "Kora imyitozo yombi buri gihembwe." },
    ],
  },
  {
    title: { en: "7-step customer service & basic first aid", sw: "Huduma kwa wateja hatua 7 na huduma ya kwanza", rw: "Serivisi z'abakiriya intambwe 7 n'ubufasha bw'ibanze" },
    bullets: [
      { en: "Greet in 5 seconds. Engine off. No phones at the pump.", sw: "Salimia ndani ya sekunde 5. Zima injini. Hakuna simu.", rw: "Ramutsa mu masegonda 5. Zimya moteri. Nta telefone." },
      { en: "First aid: pressure for cuts, cool water for burns, back blows for choking.", sw: "Huduma ya kwanza: shinikizo kwa kukatwa, maji baridi kwa kuungua, kupiga mgongoni kwa kukwama.", rw: "Ubufasha: kanda ku gukomereka, amazi akonje ku gutwikwa, kubita mu mugongo ku guhera." },
      { en: "Call an ambulance early for heart or stroke signs.", sw: "Piga ambulansi mapema kwa dalili za moyo au kiharusi.", rw: "Hamagara ambulance hakiri kare ku bimenyetso by'umutima cyangwa inkorora." },
    ],
  },
  {
    title: { en: "30-day rollout roadmap", sw: "Ramani ya utekelezaji ya siku 30", rw: "Gahunda y'iminsi 30 yo gutangiza" },
    bullets: [
      { en: "Days 1–30: pilot at one station. Train, log, measure.", sw: "Siku 1–30: jaribio kituo kimoja. Fundisha, rekodi, pima.", rw: "Iminsi 1–30: igerageza ku kigo kimwe. Hugura, andika, pima." },
      { en: "Phase 2: network governance and statutory OHS files.", sw: "Awamu ya 2: usimamizi wa mtandao na faili za kisheria za OHS.", rw: "Icyiciro cya 2: imiyoborere y'imiyoboro n'impapuro z'amategeko ya OHS." },
      { en: "Verify all local statutory references with counsel before reliance.", sw: "Thibitisha marejeo yote ya kisheria na mwanasheria kabla ya kutegemea.", rw: "Emeza ibisobanuro byose by'amategeko n'umujyanama mbere yo kubyizera." },
    ],
  },
];
