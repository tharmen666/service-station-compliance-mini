"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { litresFromCm, maxCm, parseChart, geometryCapacityL } from "@/lib/calc";
import { appendLedger } from "@/lib/ledger";
import { Alert, Card, NumberField, PageHeader, fmt, useT } from "@/components/ui";
import type { Calibration, Tank } from "@/lib/types";

export default function TanksPage() {
  const { state, mutate } = useStore();
  const { t } = useT();
  const { tanks, settings } = state;
  const [tankId, setTankId] = useState(tanks[0]?.id ?? "");
  const tank = tanks.find((x) => x.id === tankId) ?? tanks[0];

  const [cm, setCm] = useState<number>(0);
  const [waterCm, setWaterCm] = useState<string>("");
  const [saved, setSaved] = useState<string | null>(null);

  const litres = useMemo(() => (tank ? litresFromCm(tank, cm) : 0), [tank, cm]);
  const waterLitres = useMemo(
    () => (tank && waterCm !== "" ? litresFromCm(tank, Number(waterCm)) : null),
    [tank, waterCm]
  );
  const limit = tank ? maxCm(tank) : 0;
  const outOfRange = tank ? cm < 0 || cm > limit : false;

  const recordDip = () => {
    if (!tank || outOfRange) return;
    const reading = {
      id: `D-${Date.now()}`,
      ts: new Date().toISOString(),
      tankId: tank.id,
      cm,
      litres,
      waterCm: waterCm === "" ? null : Number(waterCm),
      waterLitres,
      kind: "DIP" as const,
      role: settings.role,
    };
    mutate((s) => ({
      ...s,
      dips: [...s.dips, reading],
      ledger: appendLedger(s.ledger, settings.role, "DIP_RECORDED", `${tank.name}: ${cm} cm = ${litres} L`, reading),
    }));
    setSaved(`${tank.name}: ${fmt(litres)} L`);
  };

  const updateCalibration = (tankPatch: Partial<Tank>) => {
    if (!tank) return;
    mutate((s) => ({
      ...s,
      tanks: s.tanks.map((x) => (x.id === tank.id ? { ...x, ...tankPatch } : x)),
      ledger: appendLedger(s.ledger, settings.role, "TANK_CONFIG", `${tank.name} calibration updated`, tankPatch),
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("tanksTitle")} sub={t("tanksSub")} />

      <Alert tone="danger">
        <span className="flex items-start gap-2">
          <AlertTriangle size={24} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            <strong>{t("safetyTitle")}</strong>
            <br />
            {t("safetyBody")}
          </span>
        </span>
      </Alert>

      <Card title={t("dipCm")}>
        <div className="space-y-3">
          <label className="block">
            <span className="label">{t("tanksTitle")}</span>
            <select className="field" value={tank?.id} onChange={(e) => setTankId(e.target.value)}>
              {tanks.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} — {x.product}
                </option>
              ))}
            </select>
          </label>

          <NumberField label={t("dipCm")} value={cm} onChange={setCm} step="0.1" hint={`0 – ${limit} cm`} />
          {outOfRange ? <Alert tone="danger">0 – {limit} cm</Alert> : null}

          <label className="block">
            <span className="label">{t("waterCm")}</span>
            <input className="field" type="number" inputMode="decimal" step="0.1" min={0} value={waterCm} onChange={(e) => setWaterCm(e.target.value)} />
          </label>

          <div className="rounded-xl border-2 border-primary bg-white p-4">
            <p className="text-base font-bold text-muted">{t("litres")}</p>
            <p className="text-5xl font-extrabold text-ink" data-testid="litres">
              {fmt(litres)} L
            </p>
            {waterLitres !== null ? (
              <p className="mt-1 text-base font-bold text-muted">
                {t("waterCm")}: {fmt(waterLitres)} L
              </p>
            ) : null}
          </div>

          <button type="button" className="btn w-full" onClick={recordDip} disabled={!tank || outOfRange}>
            <Save size={20} aria-hidden="true" />
            {t("recordDip")}
          </button>
          {saved ? <Alert tone="ok">{t("dipLocked")}: {saved}</Alert> : null}
        </div>
      </Card>

      {tank ? (
        <Card title={`${tank.name} · ${t("capacity")}`}>
          <CalibrationEditor key={tank.id} tank={tank} onSave={updateCalibration} capacityText={t("capacityWarn")} />
        </Card>
      ) : null}
    </div>
  );
}

function CalibrationEditor({
  tank,
  onSave,
  capacityText,
}: {
  tank: Tank;
  onSave: (patch: Partial<Tank>) => void;
  capacityText: string;
}) {
  const { t } = useT();
  const [mode, setMode] = useState<Calibration["mode"]>(tank.calibration.mode);
  const [capacityL, setCapacityL] = useState<number>(tank.capacityL);
  const [diameterCm, setDiameterCm] = useState<number>(tank.calibration.mode === "geometry" ? tank.calibration.diameterCm : 200);
  const [lengthCm, setLengthCm] = useState<number>(tank.calibration.mode === "geometry" ? tank.calibration.lengthCm : 955);
  const [chartText, setChartText] = useState<string>(
    tank.calibration.mode === "table" ? tank.calibration.points.map((p) => `${p.cm},${p.litres}`).join("\n") : "0,0\n100,30000"
  );
  const [errors, setErrors] = useState<string[]>([]);

  const draft: Tank = {
    ...tank,
    capacityL,
    calibration:
      mode === "geometry" ? { mode, diameterCm, lengthCm } : { mode, points: parseChart(chartText).points },
  };
  const geo = geometryCapacityL(draft);
  const capWarn = geo !== null && capacityL > 0 && Math.abs(geo - capacityL) / capacityL > 0.01;

  const save = () => {
    if (mode === "table") {
      const parsed = parseChart(chartText);
      if (parsed.errors.length) return setErrors(parsed.errors);
      setErrors([]);
      onSave({ capacityL, calibration: { mode, points: parsed.points } });
    } else {
      setErrors([]);
      onSave({ capacityL, calibration: { mode, diameterCm, lengthCm } });
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">Calibration</span>
        <select className="field" value={mode} onChange={(e) => setMode(e.target.value as Calibration["mode"])}>
          <option value="geometry">Horizontal cylinder (diameter & length)</option>
          <option value="table">Custom strapping chart (cm,litres)</option>
        </select>
      </label>

      <NumberField label={`${t("capacity")} (L)`} value={capacityL} onChange={setCapacityL} step="1" />

      {mode === "geometry" ? (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Diameter (cm)" value={diameterCm} onChange={setDiameterCm} step="0.1" />
          <NumberField label="Length (cm)" value={lengthCm} onChange={setLengthCm} step="0.1" />
        </div>
      ) : (
        <label className="block">
          <span className="label">Chart (one "cm,litres" per line)</span>
          <textarea className="field min-h-[160px] font-mono text-base" value={chartText} onChange={(e) => setChartText(e.target.value)} />
        </label>
      )}

      {capWarn ? <Alert tone="danger">{capacityText}: {fmt(geo, 0)} L</Alert> : null}
      {errors.length ? (
        <Alert tone="danger">
          {t("chartErrors")}: {errors.join("; ")}
        </Alert>
      ) : null}

      <button type="button" className="btn-ghost w-full" onClick={save}>
        <Save size={20} aria-hidden="true" />
        {t("save")}
      </button>
    </div>
  );
}
