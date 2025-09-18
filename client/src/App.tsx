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
  const agents = [
    { name: 'PerformanceMonitorAgent', status: 'active' },
    { name: 'FormationIntelligenceAgent', status: 'idle' },
    { name: 'PredictiveMaintenanceAgent', status: 'active' },
    { name: 'DrillingStrategyAgent', status: 'active' },
  ]
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
        <div className="lg:col-span-2"><LLMQuery /></div>
      </div>
    </div>
  )
}
