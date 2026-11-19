"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { verifyLedger } from "@/lib/ledger";
import { Alert, PageHeader, useT } from "@/components/ui";

export default function LedgerPage() {
  const { state } = useStore();
  const { t } = useT();
  const [result, setResult] = useState<ReturnType<typeof verifyLedger> | null>(null);
  const reversed = useMemo(() => [...state.ledger].reverse(), [state.ledger]);

  return (
    <div className="space-y-4">
      <PageHeader title={t("ledgerTitle")} sub={t("ledgerSub")} />

      <button type="button" className="btn w-full" onClick={() => setResult(verifyLedger(state.ledger))}>
        <ShieldCheck size={20} aria-hidden="true" />
        {t("verify")}
      </button>

      {result ? (
        result.ok ? (
          <Alert tone="ok">
            {t("ledgerOk")} · {state.ledger.length} entries
          </Alert>
        ) : (
          <Alert tone="danger">
            <ShieldAlert size={20} aria-hidden="true" className="mr-1 inline" />
            {t("ledgerBroken")} #{result.brokenAt}
          </Alert>
        )
      ) : null}

      <ol className="space-y-2">
        {reversed.map((e) => (
          <li key={e.seq} className="card p-3">
            <p className="text-sm font-bold text-muted">
              #{e.seq} · {new Date(e.ts).toLocaleString()} · {e.role}
            </p>
            <p className="text-lg font-extrabold">{e.type}</p>
            <p className="text-base">{e.summary}</p>
            <p className="mt-1 break-all font-mono text-xs text-muted">sha256: {e.hash}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
