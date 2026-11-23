import type { ShiftRecon } from "./calc";
import type { Lang } from "./types";

const LOCALE_PREFERENCE: Record<Lang, string[]> = {
  "en-KE": ["en-KE", "en-TZ", "en-GB", "en-ZA", "en-US", "en"],
  sw: ["sw-KE", "sw-TZ", "sw", "en-KE", "en-GB", "en"],
  "en-GH": ["en-GH", "en-NG", "en-GB", "en-US", "en"],
  "en-ZA": ["en-ZA", "en-GB", "en-US", "en"],
  zu: ["zu-ZA", "zu", "en-ZA", "en-GB", "en"],
  af: ["af-ZA", "af", "en-ZA", "en-GB", "en"],
  rw: ["rw-RW", "rw", "en-KE", "en-GB", "en"],
};

export function pickBestVoice(
  lang: Lang,
  voices: SpeechSynthesisVoice[]
): { voice: SpeechSynthesisVoice | null; matchedLabel: string } {
  if (!voices.length) return { voice: null, matchedLabel: "Browser default voice" };

  const prefs = LOCALE_PREFERENCE[lang] ?? LOCALE_PREFERENCE["en-KE"];

  for (const tag of prefs) {
    const exact = voices.filter((v) => v.lang.toLowerCase() === tag.toLowerCase());
    if (exact.length > 0) {
      const natural =
        exact.find((v) => /natural|online|google|microsoft/i.test(v.name)) ?? exact[0];
      return { voice: natural, matchedLabel: `${natural.name} (${natural.lang})` };
    }

    const prefix = tag.split("-")[0].toLowerCase();
    const partial = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    if (partial.length > 0) {
      const natural =
        partial.find((v) => /natural|online|google|microsoft/i.test(v.name)) ?? partial[0];
      return { voice: natural, matchedLabel: `${natural.name} (${natural.lang})` };
    }
  }

  return { voice: voices[0], matchedLabel: `${voices[0].name} (${voices[0].lang})` };
}

export function buildShiftBriefingScript({
  lang,
  stationName,
  shiftId,
  recon,
}: {
  lang: Lang;
  stationName: string;
  shiftId: string;
  recon: ShiftRecon;
}): string {
  const totalDispensed = recon.tanks.reduce((sum, t) => sum + t.dispensedL, 0);
  const breached = recon.triggers.filter((t) => t.status === "BREACH");
  const warned = recon.triggers.filter((t) => t.status === "WARN");
  const pending = recon.triggers.filter((t) => t.status === "PENDING");
  const breachSummary = breached.map((b) => `${b.title}: ${b.metric}`).join(". ");
  const warnSummary = warned.map((w) => `${w.title}: ${w.metric}`).join(". ");

  if (lang === "sw") {
    const statusLine = recon.locked
      ? `Tahadhari: Zamu ${shiftId} imefungwa kwa ukaguzi. Kuna vichocheo ${breached.length} vilivyokiuka kiwango.`
      : pending.length > 0
      ? `Zamu ${shiftId} iko wazi na inasubiri vipimo vya mwisho.`
      : `Zamu ${shiftId} iko ndani ya kiwango cha usalama.`;
    const triggerLine = breachSummary ? ` Vichocheo vilivyovuka kiwango: ${breachSummary}.` : "";
    const actionLine = recon.locked
      ? " Hatua ya msimamizi: chagua chanzo kikuu na uweke jina na kitambulisho kabla ya kufunga zamu."
      : " Hatua inayofuata: hakiki fedha taslimu na usaini kufunga zamu kwa SHA-256.";
    return `${stationName}. Hali ya upimaji: ${recon.gaugingMode}. Jumla ya lita zilizouzwa: ${Math.round(totalDispensed)} lita. ${statusLine}${triggerLine}${actionLine}`;
  }

  if (lang === "zu") {
    const statusLine = recon.locked
      ? `Isexwayiso: Ishifu ${shiftId} ikhiyiwe. Kunezinkinga ezi-${breached.length} ezidinga uphenyo.`
      : `Ishifu ${shiftId} isesimweni esiphephile.`;
    const actionLine = recon.locked
      ? " Isinyathelo esilandelayo: khetha imbangela eyinhloko bese ufaka igama ne-ID yesuphavayiza."
      : " Isinyathelo esilandelayo: qinisekisa imali bese usayina ishifu nge-SHA-256.";
    return `${stationName}. Indlela yokulinganisa: ${recon.gaugingMode}. Uphethiloli othengisiwe: amalitha ayi-${Math.round(totalDispensed)}. ${statusLine}${breachSummary ? ` ${breachSummary}.` : ""}${actionLine}`;
  }

  if (lang === "af") {
    const statusLine = recon.locked
      ? `Waarskuwing: Skof ${shiftId} is gesluit. Daar is ${breached.length} kritieke sneller(s).`
      : `Skof ${shiftId} is binne verdraagsaamheid.`;
    const actionLine = recon.locked
      ? " Vereiste aksie: kies 'n verpligte oorsaak en voer toesighouer naam en ID in."
      : " Volgende stap: bevestig kontantversameling en teken skof af met SHA-256.";
    return `${stationName}. Metingsmodus: ${recon.gaugingMode}. Totaal verkoop: ${Math.round(totalDispensed)} liter. ${statusLine}${breachSummary ? ` ${breachSummary}.` : ""}${actionLine}`;
  }

  if (lang === "rw") {
    const statusLine = recon.locked
      ? `Umuburo: Akazi ${shiftId} karafunze. Hari ibibazo ${breached.length} bisaba iperereza.`
      : `Akazi ${shiftId} kari ku murongo mwiza.`;
    return `${stationName}. Uburyo bwo gupima: ${recon.gaugingMode}. Litiro zagurishijwe: ${Math.round(totalDispensed)}. ${statusLine}${breachSummary ? ` ${breachSummary}.` : ""}`;
  }

  // English regional briefing (Kenya / Ghana / South Africa)
  const statusLine = recon.locked
    ? `Alert: Shift ${shiftId} is locked with ${breached.length} active trigger breach${breached.length === 1 ? "" : "es"}.`
    : pending.length > 0
    ? `Shift ${shiftId} is open and awaiting closing tank readings.`
    : `Shift ${shiftId} is within tolerance across all five wetstock and environmental checks.`;

  const detailLine = breachSummary
    ? ` Active breaches: ${breachSummary}.`
    : warnSummary
    ? ` Early warnings: ${warnSummary}.`
    : "";

  const actionLine = recon.locked
    ? " Required supervisor action: select a mandatory root-cause classification and enter Supervisor Name and ID before SHA-256 sign-off."
    : pending.length > 0
    ? " Next step: record closing dips or ATG telemetry for all tanks."
    : " Ready for supervisor SHA-256 sign-off and shift closure.";

  return `${stationName}. Gauging mode: ${recon.gaugingMode}. Total dispensed: ${Math.round(totalDispensed).toLocaleString()} litres. Expected revenue: ${recon.currency} ${Math.round(recon.expectedRevenue).toLocaleString()}. ${statusLine}${detailLine}${actionLine}`;
}

