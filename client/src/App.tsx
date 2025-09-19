import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from './services/api'
import { socket } from './services/socket'

interface SensorData {
  timestamp: string
  wellId: string
  bitDepth: number
  rateOfPenetration: number
  weightOnBit: number
  rotarySpeed: number
  torque: number
  mudFlowRate: number
  hookLoad: number
  vibration: number
  temperature: number
  pressure: number
}

function FormationLookaheadPanel({ currentDepth, wellId }: { currentDepth: number; wellId: string }) {
  const [ahead, setAhead] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/graph/lookahead', { params: { wellId, currentDepth: Math.round(currentDepth), count: 2 } })
      setAhead(res.data?.next ?? [])
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Graph unavailable (Neo4j disabled or not configured)'
      setError(msg)
      setAhead([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [currentDepth, wellId])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Formation Lookahead</h2>
        <button onClick={load} disabled={loading} className="px-2 py-1 rounded bg-indigo-600 text-white text-sm disabled:opacity-50">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Current depth: {Math.round(currentDepth)} ft</div>
      {error && <div className="text-amber-600 text-sm mb-2">{error}</div>}
      {!error && ahead.length === 0 && <div className="text-gray-500">No formations ahead</div>}
      <ul className="space-y-2">
        {ahead.map((f, i) => (
          <li key={i} className="border border-gray-200 dark:border-gray-700 rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Depth: {f.depth ?? '—'} ft</div>
              </div>
              <div className="text-sm text-right">
                <div>Hardness: {f.properties?.hardness ?? '—'}</div>
                <div>Rock Strength: {f.properties?.rockStrength ?? '—'}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GraphInsightsPanel() {
  const [wells, setWells] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/graph/offset-wells', { params: { wellId: 'well-001', limit: 5 } })
      setWells(res.data?.wells ?? [])
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Graph unavailable (Neo4j disabled or not configured)'
      setError(msg)
      setWells([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Graph Insights — Offset Wells</h2>
        <button onClick={load} disabled={loading} className="px-2 py-1 rounded bg-indigo-600 text-white text-sm disabled:opacity-50">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error && <div className="text-amber-600 text-sm mb-2">{error}</div>}
      {(!error && wells.length === 0) && <div className="text-gray-500">No offset wells found</div>}
      <ul className="space-y-2">
        {wells.map((w, i) => (
          <li key={i} className="border border-gray-200 dark:border-gray-700 rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{w.name || w.id}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{w.location || 'Unknown'} • {w.type || 'Well'}</div>
              </div>
              <div className="text-sm">Similarity: {(w.similarity ?? 0).toFixed(2)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function useSensorStream(wellId: string) {
  const [data, setData] = useState<SensorData[]>([])
  useEffect(() => {
    let mounted = true
    api.get<SensorData[]>(`/sensor/${wellId}?limit=200`).then(res => mounted && setData(res.data))
    socket.on('sensor:update', (msg: SensorData) => {
      if (msg.wellId !== wellId) return
      setData(prev => {
        const next = [...prev, msg]
        return next.slice(-200)
      })
    })
    return () => { mounted = false; socket.off('sensor:update') }
  }, [wellId])
  return data
}

function AlertsPanel({ data }: { data: SensorData[] }) {
  const alerts = useMemo(() => {
    const arr: { ts: string; severity: 'warning' | 'critical'; text: string }[] = []
    if (data.length >= 2) {
      const last = data[data.length - 1]
      const prev = data[data.length - 2]
      const ropDrop = (prev.rateOfPenetration - last.rateOfPenetration) / Math.max(prev.rateOfPenetration, 1e-6)
      if (ropDrop > 0.2) arr.push({ ts: last.timestamp, severity: 'warning', text: `ROP dropped ${(ropDrop * 100).toFixed(1)}%` })
      if (last.vibration > 3) arr.push({ ts: last.timestamp, severity: 'critical', text: 'High vibration detected' })
      if (last.torque > 30000) arr.push({ ts: last.timestamp, severity: 'warning', text: 'Torque spike detected' })
    }
    return arr.slice(-5)
  }, [data])
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">Alerts</h2>
      <ul className="space-y-2">
        {alerts.length === 0 && <li className="text-gray-500">No alerts</li>}
        {alerts.map((a, i) => (
          <li key={i} className={a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}>
            <span className="font-medium">[{a.severity.toUpperCase()}]</span> {new Date(a.ts).toLocaleTimeString()} — {a.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AgentStatus() {
  const [agents, setAgents] = useState<{ name: string; status: string }[]>([])
  useEffect(() => {
    let mounted = true
    api.get('/agents/status').then(res => {
      if (mounted) setAgents(res.data)
    }).catch(() => setAgents([]))
    return () => { mounted = false }
  }, [])
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">Agents</h2>
      <div className="grid grid-cols-2 gap-2">
        {agents.map(a => (
          <div key={a.name} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded px-2 py-1">
            <span>{a.name}</span>
            <span className={`text-sm ${a.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationsPanel() {
  const [recs, setRecs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const refresh = async () => {
    setLoading(true)
    try {
      const res = await api.get('/recommendations')
      setRecs(res.data?.recommendations ?? [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { refresh() }, [])
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Recommendations</h2>
        <button onClick={refresh} disabled={loading} className="px-2 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {recs.length === 0 && <div className="text-gray-500">No recommendations yet</div>}
      <ul className="space-y-2">
        {recs.map((r, i) => (
          <li key={i} className="border border-gray-200 dark:border-gray-700 rounded p-2">
            <div className="text-sm text-gray-600 dark:text-gray-300">Agent: {r.agent} • Priority: {Math.round((r.priority ?? 0)*100)/100}</div>
            <div>{r.message ?? r.narrative ?? 'N/A'}</div>
            {r.params && (
              <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">Params: WOB {r.params.weightOnBit}, RPM {r.params.rotarySpeed}, Q {r.params.mudFlowRate}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LLMQuery() {
  const [question, setQuestion] = useState('Why has ROP dropped in the last 100 feet?')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const ask = async () => {
    setLoading(true)
    try {
      const res = await api.post('/llm/query', { question, context: {} })
      setAnswer(res.data.answer)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">Ask the Twin</h2>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full h-24 p-2 rounded border dark:bg-gray-900" />
      <button onClick={ask} disabled={loading} className="mt-2 px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">{loading ? 'Asking…' : 'Ask'}</button>
      {answer && <pre className="mt-3 whitespace-pre-wrap text-sm">{answer}</pre>}
    </div>
  )
}

export default function App() {
  const data = useSensorStream('well-001')
  const [recommendation, setRecommendation] = useState<string>('')
  useEffect(() => {
    let timer = setInterval(async () => {
      try {
        const res = await api.get('/orchestrator/mock')
        const msg = res.data?.decision?.message || res.data?.decision?.narrative || 'Monitoring…'
        setRecommendation(msg)
      } catch (_) {
        // ignore
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [])
  const kpi = useMemo(() => {
    const n = data.length || 1
    const avgROP = data.reduce((s, d) => s + d.rateOfPenetration, 0) / n
    const costPerFoot = 1000 / Math.max(avgROP, 1e-3)
    return { avgROP, costPerFoot }
  }, [data])

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Enterprise Digital Twin — Drilling Optimization</h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">Avg ROP: {kpi.avgROP.toFixed(1)} ft/hr • Cost/ft: ${kpi.costPerFoot.toFixed(2)}</div>
      </header>

      {recommendation && (
        <div className="rounded-md p-3 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          <span className="font-semibold">Recommendation:</span> {recommendation}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Real-time ROP</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.map(d => ({ ...d, t: new Date(d.timestamp).toLocaleTimeString() }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" minTickGap={20} />
                <YAxis yAxisId="left" dataKey="rateOfPenetration" label={{ value: 'ROP (ft/hr)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="rateOfPenetration" stroke="#2563eb" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <AlertsPanel data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AgentStatus />
        <div className="lg:col-span-2 space-y-6">
          <RecommendationsPanel />
          <GraphInsightsPanel />
          <FormationLookaheadPanel currentDepth={data[data.length-1]?.bitDepth ?? 3000} wellId={'well-001'} />
          <LLMQuery />
        </div>
      </div>
    </div>
  )
}
