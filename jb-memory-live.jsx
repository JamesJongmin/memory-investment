import { useState, useEffect } from "react";

const C = { blue: "#3182F6", red: "#F04452", green: "#00C48C", orange: "#FF9500", gray: "#8E8E93", lgray: "#AEAEB2", dark: "#1B1B1F" };

const DEFAULT_DATA = {
  dataVersion: 1,
  lastUpdate: "2026-05-29",
  dramPrice: 82800, dramPeriod: "5월 1-20일", dramMom: 13.1, dramYoy: 434,
  flashPrice: 54700, flashMom: 23.3, flashYoy: 280,
  position: "풀 홀딩",
  signals: { s1: true, s2: true, s3: true, t1: true, t2: true, t3: true },
  notes: [
    { date: "2026-05-29", text: "TrendForce TAM $1.28조+(2027)로 대폭 상향" },
    { date: "2026-05-29", text: "DRAMeXchange 2Q PC DRAM +40-50% QoQ 확정, 3Q +8-13%로 상향" },
    { date: "2026-05-29", text: "NAND SLC 5월 +3-16%, MLC 누적 +280%. 레거시 회복 의지 부재" },
  ]
};

export default function App() {
  const [tab, setTab] = useState("thesis");
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Data sources, newest dataVersion wins:
      //  1) thesis-data.json  — written daily by the scheduled task (Cowork live artifact reads this)
      //  2) window.__THESIS_DATA__ — injected via thesis-data.js (standalone HTML reads this)
      //  3) window.storage — previously saved/manual edits
      //  4) DEFAULT_DATA — built-in fallback
      const candidates = [DEFAULT_DATA];
      try {
        const resp = await fetch("thesis-data.json", { cache: "no-store" });
        if (resp.ok) candidates.push(await resp.json());
      } catch (e) { /* file not present yet */ }
      if (typeof window !== "undefined" && window.__THESIS_DATA__) candidates.push(window.__THESIS_DATA__);
      try {
        const r = await window.storage.get("thesis-data");
        if (r && r.value) candidates.push(JSON.parse(r.value));
      } catch (e) { /* first load */ }
      const chosen = candidates.reduce((a, b) => ((b.dataVersion || 0) >= (a.dataVersion || 0) ? b : a), DEFAULT_DATA);
      setData(chosen);
      try { await window.storage.set("thesis-data", JSON.stringify(chosen)); } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const save = async (newData) => {
    setData(newData);
    try { await window.storage.set("thesis-data", JSON.stringify(newData)); } catch (e) {}
  };

  const tabs = [
    { id: "thesis", label: "테시스" },
    { id: "price", label: "단가" },
    { id: "demand", label: "수요" },
    { id: "supply", label: "공급" },
    { id: "shift", label: "전환" },
    { id: "catalyst", label: "촉매" },
    { id: "sell", label: "매도" },
    { id: "update", label: "✏️ 업데이트" },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.gray }}>Loading...</div>;

  const dp = (data.dramPrice / 1000).toFixed(1);
  const allClear = Object.values(data.signals).every(Boolean);
  const t1Count = [data.signals.s1, data.signals.s2, data.signals.s3].filter(v => !v).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F7", fontFamily: "-apple-system, 'Noto Sans KR', sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "#EEF4FF", textAlign: "center", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: C.blue }}>
        LIVE | 20+ sources | Last: {data.lastUpdate}
      </div>

      <div style={{ background: "#FFF", padding: "24px 24px 16px", borderBottom: "1px solid #E5E5EA" }}>
        <p style={{ fontSize: 11, color: C.lgray, margin: "0 0 6px" }}>{data.lastUpdate} | Published by Jongmin Baek</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: C.dark, lineHeight: 1.2 }}>메모리 반도체 투자 포인트</h1>
        <p style={{ fontSize: 13, color: C.dark, margin: "8px 0 0", fontWeight: 700 }}>AI 시대, 가장 과소평가된 전략적 자산</p>
      </div>

      <div style={{ display: "flex", overflowX: "auto", background: "#FFF", borderBottom: "1px solid #E5E5EA", padding: "0 4px" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", borderBottom: tab === t.id ? "2px solid " + C.blue : "2px solid transparent",
            color: tab === t.id ? C.blue : C.gray, padding: "10px 10px", fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "12px 16px 40px" }}>
        {tab === "thesis" && <ThesisTab data={data} dp={dp} allClear={allClear} t1Count={t1Count} />}
        {tab === "price" && <PriceTab data={data} dp={dp} />}
        {tab === "demand" && <DemandTab />}
        {tab === "supply" && <SupplyTab />}
        {tab === "shift" && <ShiftTab />}
        {tab === "catalyst" && <CatalystTab />}
        {tab === "sell" && <SellTab data={data} allClear={allClear} t1Count={t1Count} />}
        {tab === "update" && <UpdateTab data={data} save={save} />}
      </div>

      <p style={{ textAlign: "center", fontSize: 9, color: "#C7C7CC", lineHeight: 1.8, padding: "0 24px 40px" }}>
        메리츠 | JPM | Citi | MS | GS | BofA | UBS | Mizuho | Cleveland | Edgewater | SK증권 | 한투 | 다올 | SemiAnalysis | IDC | Reuters | Barrons | TrendForce
      </p>
    </div>
  );
}

/* ═══ COMPONENTS ═══ */
function Box({ children }) { return <div style={{ background: "#FFF", borderRadius: 20, padding: "20px 18px", marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>{children}</div>; }
function Stat({ label, value, sub, color }) { return <div style={{ background: "#F9F9FB", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}><p style={{ fontSize: 10, color: C.lgray, margin: "0 0 3px" }}>{label}</p><p style={{ fontSize: 20, fontWeight: 900, color: color || C.red, margin: 0 }}>{value}</p><p style={{ fontSize: 9, color: "#C7C7CC", margin: "2px 0 0" }}>{sub}</p></div>; }
function InfoBox({ children }) { return <div style={{ background: "#F9F9FB", borderRadius: 12, padding: "12px 14px", marginTop: 12, fontSize: 12, color: "#636366", lineHeight: 1.7 }}>{children}</div>; }
function Bar({ l, v, p, c, dim }) { return <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 600, color: dim ? C.lgray : (c || C.dark) }}>{l}</span><span style={{ fontSize: 12, fontWeight: 700, color: dim ? C.lgray : (c || C.dark) }}>{v}</span></div><div style={{ height: 7, background: "#F2F2F7", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: p + "%", background: c || C.dark, borderRadius: 4 }} /></div></div>; }

/* ═══ THESIS TAB ═══ */
function ThesisTab({ data, dp, allClear, t1Count }) {
  return (
    <div style={{ background: C.dark, borderRadius: 20, padding: "24px 20px" }}>
      <p style={{ fontSize: 10, color: "#555", fontWeight: 700, margin: "0 0 8px", letterSpacing: 2 }}>INVESTMENT THESIS</p>
      <p style={{ fontSize: 22, fontWeight: 900, color: "#FFF", lineHeight: 1.3, margin: "0 0 16px" }}>
        DRAM <span style={{ color: "#FFD166" }}>${dp}K</span> {"→"} <span style={{ color: C.blue }}>$120-150K</span>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#2A2A30", borderRadius: 12, padding: "12px 10px" }}>
          <p style={{ fontSize: 9, color: "#636366", margin: "0 0 4px" }}>17-18년</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#999", margin: 0 }}>$74B</p>
          <p style={{ fontSize: 9, color: "#636366", margin: "3px 0 0" }}>Capex | 메모리 직결 50-60%</p>
          <p style={{ fontSize: 9, color: "#636366", margin: "2px 0 0" }}>= ~$40B | DRAM 고점 $35K/kg</p>
        </div>
        <div style={{ background: "#1A2A3A", borderRadius: 12, padding: "12px 10px", border: "1px solid #3182F633" }}>
          <p style={{ fontSize: 9, color: C.blue, margin: "0 0 4px" }}>25-26년</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.blue, margin: 0 }}>+80% YoY</p>
          <p style={{ fontSize: 9, color: "#888", margin: "3px 0 0" }}>DC Capex | 메모리 직결 25-30%</p>
          <p style={{ fontSize: 9, color: "#888", margin: "2px 0 0" }}>= ~$2,000B | DRAM ${dp}K/kg</p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: C.lgray, lineHeight: 1.8, margin: "0 0 14px" }}>
        직결 지출 <span style={{ color: "#FFD166" }}>5-6배</span>인데 단가 <span style={{ color: "#FFD166" }}>{(data.dramPrice / 35000).toFixed(1)}배</span>. 갭 존재.
        <br />VR200 메모리 BOM <span style={{ color: C.red }}>$2.0M</span> = GB300의 5.35배 (+435%).
        <br />메모리 TAM: 2026 $8,893억 {"→"} 2027 <span style={{ color: C.red }}>$1.28조+</span> (TrendForce)
      </p>
      <div style={{ height: 1, background: "#333", margin: "14px 0" }} />
      <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.7, margin: 0 }}>
        <strong style={{ color: "#FFF" }}>{data.position}</strong> | P/B{"→"}P/E 전환 <span style={{ color: C.green }}>진행 중</span>
        <br />{allClear ? <span style={{ color: C.green }}>전 시그널 클리어</span> : <span style={{ color: C.red }}>TIER 1 경고 {t1Count}개</span>}
      </p>
      {data.notes.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #333" }}>
          <p style={{ fontSize: 10, color: "#555", margin: "0 0 8px" }}>최근 업데이트</p>
          {data.notes.slice(0, 3).map((n, i) => (
            <p key={i} style={{ fontSize: 10, color: "#888", margin: "0 0 4px", lineHeight: 1.5 }}>{n.date} | {n.text}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ PRICE TAB ═══ */
function PriceTab({ data, dp }) {
  const fp = (data.flashPrice / 1000).toFixed(1);
  const pct = Math.min(Math.round(data.dramPrice / 2200), 100);
  return (
    <Box>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.lgray, margin: "0 0 6px" }}>DRAM 수출단가 ({data.dramPeriod})</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Stat label="DRAM 단독" value={"$" + dp + "K"} sub={"MoM +" + data.dramMom + "% | YoY +" + data.dramYoy + "%"} />
        <Stat label="Flash" value={"$" + fp + "K"} sub={"MoM +" + data.flashMom + "% | YoY +" + data.flashYoy + "%"} />
      </div>
      <div style={{ height: 1, background: "#F2F2F7", margin: "16px 0" }} />
      <p style={{ fontSize: 11, fontWeight: 700, color: C.lgray, margin: "0 0 10px" }}>DRAM 단독 ($/kg)</p>
      <Bar l="'18 고점" v="$35K" p={16} c="#D1D1D6" dim />
      <Bar l="4월 확정" v="$66K" p={30} c={C.gray} dim />
      <Bar l={data.dramPeriod} v={"$" + dp + "K"} p={pct} c={C.dark} />
      <Bar l="기본" v="$120-150K" p={61} c={C.blue} />
      <Bar l="강세" v="$150-220K" p={84} c={C.red} />
      <div style={{ height: 1, background: "#F2F2F7", margin: "16px 0" }} />
      <p style={{ fontSize: 11, fontWeight: 700, color: C.lgray, margin: "0 0 10px" }}>$120-150K 근거</p>
      {[
        ["1", "Capex 레버리지 + BOM", "VR200 메모리 BOM $2.0M (+435%). 직결 지출 5-6배 vs 단가 2.4배 갭."],
        ["2", "수급 갭 40%p+", "요청 150 중 배정 30-50. HBM 웨이퍼 23% 소비. 2028년 전 증설 불가."],
        ["3", "CPU 독립 수요", "Vera $200억 = 3,000PB = DRAM 6%. CPU향 DRAM 15-45EB."],
        ["4", "가격 가속도", "2Q +40-50% 확정. 3Q +8-13% 상향. 4분기 연속 QoQ 플러스."],
        ["5", "공급자 행동", "SK: 31조 팹 제안 거절. 삼성: 견적 철회 후 10%+ 인상. 레거시 단종."],
        ["6", "IB 컨센서스", "파텔 2-3배. UBS MU TP $1,625 (P/E 15x). BofA 충족률 110% 미만."],
      ].map(([n, t, d]) => (
        <div key={n} style={{ padding: "8px 0", borderBottom: "1px solid #F2F2F7" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: C.blue, color: "#FFF", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
            <div><p style={{ fontSize: 12, fontWeight: 700, color: C.dark, margin: "0 0 2px" }}>{t}</p><p style={{ fontSize: 10, color: "#636366", lineHeight: 1.5, margin: 0 }}>{d}</p></div>
          </div>
        </div>
      ))}
      <InfoBox>
        <strong style={{ color: C.green }}>BofA "구조적으로 높아진 하한선":</strong> 급등 → 고원(plateau). CY28까지 과잉공급 없음.
        <br /><strong style={{ color: C.red }}>2027 HBM4e YoY +70-100% (미즈호).</strong> 에이전틱 CPU 본격화 시 강세 $150K+.
      </InfoBox>
    </Box>
  );
}

/* ═══ DEMAND TAB ═══ */
function DemandTab() {
  const [open, setOpen] = useState(null);
  const waves = [
    { id: "w1", em: "🔥", t: "1파동: GPU/HBM", c: C.red, s: "HBM 공급 30-50% 부족 | 2027 HBM4e +70-100%",
      d: ["HBM TAM $350B→$1,680B (CAGR +37%) | 웨이퍼 23% 소비", "2027 HBM4e 가격 YoY +70-100% (미즈호)", "추가 물량에 20-40% 프리미엄 (Edgewater)", "HBM4E 16Hi→12Hi 후퇴 (수율). CoWoS 수요 850K(27)"] },
    { id: "w2", em: "⚡", t: "2파동: CPU/DDR5", c: C.blue, s: "Vera $200억 = DRAM 6% | 랙당 SoCAMM 2,048개",
      d: ["Vera 독립 랙 2,048 SoCAMM (NVL72의 7.1배)", "FY27 $200억 = 400만CPU = 3,000PB = 글로벌 DRAM 6%", "VR Pod 9,084PB + Vera 6,144PB = 스마트폰 13억대", "CPU향 DRAM 추가 15-45EB = 2027 공급의 26-77% (MS)"] },
    { id: "w3", em: "📱", t: "3파동: 엣지/PC (진행 시작)", c: C.green, s: "Dell 전통 서버 +92% | CSG 역대 최고",
      d: ["Dell: '공급이 유일한 상한. DRAM이 1순위 병목'", "전통 서버 +92% YoY = 에이전틱 AI가 CPU 서버 견인", "CSG 역대 최고 $13B. 4년+ 노후 디바이스 1/3 잔존", "NVIDIA PC 프로세서 진출 = AI PC 시장 확대"] },
  ];
  return (
    <Box>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 4px" }}>3파동 동시 폭발</p>
      <p style={{ fontSize: 12, color: C.gray, margin: "0 0 12px" }}>과거 1파동만으로 업사이클. 지금 3개 동시.</p>
      {waves.map((w) => (
        <div key={w.id} onClick={() => setOpen(open === w.id ? null : w.id)} style={{ padding: "12px 0", borderBottom: "1px solid #F2F2F7", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: w.c + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 15 }}>{w.em}</span></div>
            <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: 0 }}>{w.t}</p><p style={{ fontSize: 10, color: C.gray, margin: "2px 0 0", lineHeight: 1.4 }}>{w.s}</p></div>
            <span style={{ color: "#C7C7CC" }}>{open === w.id ? "▾" : "›"}</span>
          </div>
          {open === w.id && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F2F2F7", marginLeft: 44 }}>{w.d.map((x, i) => <p key={i} style={{ fontSize: 10, color: "#636366", lineHeight: 1.6, margin: "0 0 2px" }}>{"· " + x}</p>)}</div>}
        </div>
      ))}
      <div style={{ background: "#FFF9F0", borderRadius: 12, padding: "12px 14px", marginTop: 12, border: "1px solid #FF950022" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.orange, margin: "0 0 4px" }}>💾 NAND</p>
        <p style={{ fontSize: 10, color: "#636366", lineHeight: 1.6, margin: 0 }}>Dell: "공급 1순위 = NAND > DRAM > CPU" | MLC 누적 +280% | 니치 수요 전방위 확대 | 레거시 회복 의지 부재</p>
      </div>
    </Box>
  );
}

/* ═══ SUPPLY TAB ═══ */
function SupplyTab() {
  return (
    <Box>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 12px" }}>전 계층 / 전 티어 공급 바닥</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Stat label="DC 소비" value="70%" sub="전 세계 메모리 생산" />
        <Stat label="DRAM 갭" value="-4.9%" sub="2011 이후 최대" />
        <Stat label="NAND 갭" value="-4.2%" sub="2011 이후 최대" />
        <Stat label="HBM 갭" value="-5.1%" sub="2011 이후 최대" />
      </div>
      <InfoBox>
        <strong style={{ color: C.red }}>1티어:</strong> SK "소량조차 없다" | Micron "수요의 50-2/3만 확보" | 삼성 "올해 부족, 내년 더 심화"
        <br /><strong style={{ color: C.orange }}>2티어:</strong> Nanya "2027말까지 부족" | 윈본드 전량 예약 | <strong style={{ color: C.red }}>ADATA "2028년까지"</strong>
        <br /><br />삼성 P4 → HBM4/4E 할당 → 범용 쇼티지 가속 | Micron 그린필드 필수 (Idaho CY27 중반)
        <br />2Q26 확정: DRAM +58-63% | NAND +70-75% (15년 최대)
      </InfoBox>
    </Box>
  );
}

/* ═══ SHIFT TAB ═══ */
function ShiftTab() {
  return (
    <Box>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 6px" }}>Boom-Bust 사이클의 종말</p>
      <div style={{ background: C.dark, borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
        <p style={{ fontSize: 10, color: "#FFD166", fontWeight: 700, margin: "0 0 4px" }}>IDC</p>
        <p style={{ fontSize: 10, color: "#CCC", lineHeight: 1.6, margin: 0 }}>"메모리는 전략적 자산으로 재평가. 2030년까지의 성장 궤적은 소비자 교체 사이클에 좌우되지 않는다."</p>
      </div>
      <div style={{ background: "#EEF4FF", borderRadius: 12, padding: 14, border: "1px solid #3182F622" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, margin: "0 0 8px" }}>2027 선행 P/E</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, textAlign: "center" }}>
          {[["5.0x", "삼성"], ["5.5x", "SK"], ["7.5x", "MU"], ["15x", "UBS"]].map(([v, n], i) => (
            <div key={i}><p style={{ fontSize: 16, fontWeight: 900, color: i < 3 ? C.red : C.blue, margin: 0 }}>{v}</p><p style={{ fontSize: 8, color: "#636366", margin: "2px 0 0" }}>{n}</p></div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#636366", margin: "8px 0 0", lineHeight: 1.5 }}>LTA로 SaaS형 수익인데 P/E 5-7x. UBS P/E 15x 적용 시작. TSMC 17.2x 수렴 시 2-3배.</p>
      </div>
      <InfoBox>
        <strong style={{ color: C.blue }}>UBS LTA:</strong> "2+3"/"3+2" 구조. DDR 20-30% LTA (SK 10%, MU 20%, 삼성 30%). 변동가 -50%에도 MU EPS $100+.
        <br /><br /><strong style={{ color: C.red }}>TP:</strong> 삼성 48만 | SK 300만 (JPM) | MU $1,625 (UBS) | $950 (BofA)
        <br />MU EPS: 2027 $155 | 2028 $167 | 2029 $117. FCF $4,000억+.
        <br /><br />SK하이닉스: 31조 팹 투자 제안 거절 = "슈퍼을". OPM 72% + 자체 21조 투자.
        <br />젠슨: "공급망 매년 4배 성장해도 10년간 부족. 이제 막 시작."
      </InfoBox>
    </Box>
  );
}

/* ═══ CATALYST TAB ═══ */
function CatalystTab() {
  return (
    <Box>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 12px" }}>실적 + LTA + ADR</p>
      {[
        ["즉각적", C.red, ["삼성/SK '역사상 최대 LTA' 공시 전망 (JPM)", "2Q DRAM ASP +37% (Citi) | 4Q HBM +30%"]],
        ["7-8월", C.blue, ["SK하이닉스 ADR (NYSE) - 20-30% 프리미엄", "SOX 편입 가능성 → 패시브 자금 유입"]],
        ["2027-30", C.green, ["HBM4e YoY +70-100% (미즈호)", "Capex CY27 $1조 → CY30 $3-4조", "에이전트 CPU 200-300만개 (미즈호) + PC 3차 파동"]],
      ].map(([period, color, items], i) => (
        <div key={i} style={{ marginTop: 12 }}>
          <span style={{ background: color, color: "#FFF", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 6 }}>{period}</span>
          {items.map((item, j) => <p key={j} style={{ fontSize: 11, color: "#636366", margin: "5px 0 0", lineHeight: 1.5 }}>{"▸ " + item}</p>)}
        </div>
      ))}
    </Box>
  );
}

/* ═══ SELL TAB ═══ */
function SellTab({ data, allClear, t1Count }) {
  const [open, setOpen] = useState(null);
  const sigs = [
    { id: "s1", em: "📦", t: "DRAM 재고 8주+", now: "2-3주", ok: data.signals.s1 },
    { id: "s2", em: "📉", t: "계약가 QoQ 하락", now: "+20-63%", ok: data.signals.s2 },
    { id: "s3", em: "🏗️", t: "3사 Capex 공격적", now: "삼성 미증가", ok: data.signals.s3 },
  ];
  return (
    <Box>
      <p style={{ fontSize: 12, color: C.gray, margin: "0 0 12px" }}>기본 홀딩. <strong style={{ color: C.red }}>TIER 1 x 2개+</strong> 시 비중 축소.</p>
      <span style={{ background: C.red, color: "#FFF", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 6 }}>TIER 1</span>
      {sigs.map((s) => (
        <div key={s.id} onClick={() => setOpen(open === s.id ? null : s.id)} style={{ padding: "10px 0", borderBottom: "1px solid #FFE5E5", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{s.em}</span>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: C.dark, margin: 0 }}>{s.t}</p>
            <p style={{ fontSize: 10, color: s.ok ? "#00864E" : C.red, fontWeight: 600, margin: "2px 0 0" }}>{s.ok ? "✅ " + s.now : "🔴 경고"}</p></div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 12 }}>
        <span style={{ background: C.orange, color: "#FFF", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 6 }}>TIER 2</span>
        {[["💰", "빅4 Capex 하향", data.signals.t1], ["🇨🇳", "CXMT 대량 출하", data.signals.t2], ["⚖️", "AI 규제/시위", data.signals.t3]].map(([em, t, ok], i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: 14 }}>{em}</span>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.dark, margin: 0, flex: 1 }}>{t}</p>
            <span style={{ fontSize: 10, color: ok ? "#00864E" : C.red }}>{ok ? "✅" : "🔴"}</span>
          </div>
        ))}
      </div>
      <div style={{ background: allClear ? "#F0FFF4" : "#FFF5F5", borderRadius: 12, padding: 12, marginTop: 12, border: allClear ? "1px solid #00C48C33" : "1px solid #F0445233" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: allClear ? "#00864E" : C.red, margin: 0 }}>{allClear ? "✅ 전 시그널 클리어" : "🔴 TIER 1 경고 " + t1Count + "개"}</p>
        <p style={{ fontSize: 10, color: "#636366", margin: "3px 0 0" }}>{allClear ? "풀 홀딩 유지" : t1Count >= 2 ? "30-50% 비중 축소 검토" : "추가 매수 중단"}</p>
      </div>
    </Box>
  );
}

/* ═══ UPDATE TAB ═══ */
function UpdateTab({ data, save }) {
  const [dramP, setDramP] = useState(String(data.dramPrice));
  const [dramPd, setDramPd] = useState(data.dramPeriod);
  const [dramM, setDramM] = useState(String(data.dramMom));
  const [dramY, setDramY] = useState(String(data.dramYoy));
  const [flashP, setFlashP] = useState(String(data.flashPrice));
  const [flashM, setFlashM] = useState(String(data.flashMom));
  const [flashY, setFlashY] = useState(String(data.flashYoy));
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const inp = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E5E5EA", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 11, fontWeight: 600, color: C.dark, margin: "12px 0 4px", display: "block" };

  const handleSave = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const newNotes = note.trim() ? [{ date: today, text: note.trim() }, ...data.notes] : data.notes;
    await save({
      ...data,
      lastUpdate: today,
      dramPrice: Number(dramP) || data.dramPrice,
      dramPeriod: dramPd,
      dramMom: Number(dramM) || data.dramMom,
      dramYoy: Number(dramY) || data.dramYoy,
      flashPrice: Number(flashP) || data.flashPrice,
      flashMom: Number(flashM) || data.flashMom,
      flashYoy: Number(flashY) || data.flashYoy,
      notes: newNotes.slice(0, 20),
    });
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSignal = async (key) => {
    const newSigs = { ...data.signals, [key]: !data.signals[key] };
    await save({ ...data, signals: newSigs });
  };

  const handleReset = async () => {
    await save(DEFAULT_DATA);
    setDramP(String(DEFAULT_DATA.dramPrice));
    setDramPd(DEFAULT_DATA.dramPeriod);
  };

  return (
    <Box>
      <p style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: "0 0 16px" }}>데이터 업데이트</p>

      <span style={lbl}>DRAM 단독 단가 ($/kg, 숫자만)</span>
      <input value={dramP} onChange={(e) => setDramP(e.target.value)} style={inp} placeholder="82800" />

      <span style={lbl}>측정 기간</span>
      <input value={dramPd} onChange={(e) => setDramPd(e.target.value)} style={inp} placeholder="5월 1-20일" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><span style={lbl}>DRAM MoM %</span><input value={dramM} onChange={(e) => setDramM(e.target.value)} style={inp} /></div>
        <div><span style={lbl}>DRAM YoY %</span><input value={dramY} onChange={(e) => setDramY(e.target.value)} style={inp} /></div>
      </div>

      <span style={lbl}>Flash 단가 ($/kg)</span>
      <input value={flashP} onChange={(e) => setFlashP(e.target.value)} style={inp} placeholder="54700" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><span style={lbl}>Flash MoM %</span><input value={flashM} onChange={(e) => setFlashM(e.target.value)} style={inp} /></div>
        <div><span style={lbl}>Flash YoY %</span><input value={flashY} onChange={(e) => setFlashY(e.target.value)} style={inp} /></div>
      </div>

      <span style={lbl}>메모 추가</span>
      <input value={note} onChange={(e) => setNote(e.target.value)} style={inp} placeholder="새로운 데이터 포인트..." />

      <button onClick={handleSave} style={{ width: "100%", padding: "14px", background: C.blue, color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, marginTop: 16, cursor: "pointer" }}>
        {saved ? "✅ 저장 완료!" : "💾 저장"}
      </button>

      <div style={{ height: 1, background: "#F2F2F7", margin: "20px 0" }} />
      <p style={{ fontSize: 14, fontWeight: 800, color: C.dark, margin: "0 0 12px" }}>매도 시그널 토글</p>

      {[
        ["s1", "📦 DRAM 재고 8주+"], ["s2", "📉 계약가 QoQ 하락"], ["s3", "🏗️ 3사 Capex 공격적"],
        ["t1", "💰 빅4 Capex 하향"], ["t2", "🇨🇳 CXMT 대량 출하"], ["t3", "⚖️ AI 규제/시위"],
      ].map(([key, label]) => (
        <div key={key} onClick={() => toggleSignal(key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F2F2F7", cursor: "pointer" }}>
          <span style={{ fontSize: 12, color: C.dark }}>{label}</span>
          <span style={{ fontSize: 20 }}>{data.signals[key] ? "🟢" : "🔴"}</span>
        </div>
      ))}

      <button onClick={handleReset} style={{ width: "100%", padding: "12px", background: "#FFF", color: C.red, border: "1px solid " + C.red, borderRadius: 12, fontSize: 12, fontWeight: 600, marginTop: 20, cursor: "pointer" }}>
        초기화 (기본값 복원)
      </button>
    </Box>
  );
}
