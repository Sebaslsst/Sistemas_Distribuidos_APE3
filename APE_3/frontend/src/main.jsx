import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const configs = {
  "1": { name: "Estacionamiento", description: "Semáforo contador para limitar vehículos dentro del estacionamiento.", url: "http://localhost:8081", start: "/api/parking/start", status: "/api/parking/status", events: "/api/parking/events" },
  "2": { name: "Cajero automático", description: "Dos retiros y un depósito protegidos por un mutex de saldo.", url: "http://localhost:8082", start: "/api/atm/start", status: "/api/atm/status", events: "/api/atm/events" },
  "3": { name: "Fábrica productor-consumidor", description: "Cola limitada, semáforos y productores/consumidores configurables.", url: "http://localhost:8083", start: "/api/production/start", status: "/api/production/status", events: "/api/production/events" },
  "4": { name: "Cruce de vehículos", description: "Mutex justo y condición para impedir direcciones simultáneas.", url: "http://localhost:8084", start: "/api/bridge/start", status: "/api/bridge/status", events: "/api/bridge/events" },
  "5": { name: "Centro de impresión", description: "Semáforos coordinan diseño, revisión e impresión de documentos.", url: "http://localhost:8085", start: "/api/printing/start", status: "/api/printing/status", events: "/api/printing/events" }
};

function App() {
  const [exercise, setExercise] = useState("1");
  const [data, setData] = useState({});
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    capacity: 4, producers: 2, consumers: 2, piecesPerWorker: 5,
    north: 5, south: 5, crossingMillis: 250
  });
  const config = configs[exercise];

  const refresh = async () => {
    try {
      const [statusResponse, eventsResponse] = await Promise.all([
        fetch(config.url + config.status),
        fetch(config.url + config.events)
      ]);
      setData(await statusResponse.json());
      setEvents(await eventsResponse.json());
    } catch {
      setData({ error: "Backend no disponible. Ejecuta el ejercicio seleccionado." });
      setEvents([]);
    }
  };

  useEffect(() => {
    setData({});
    setEvents([]);
    refresh();
    const timer = setInterval(refresh, 500);
    return () => clearInterval(timer);
  }, [exercise]);

  const update = (name, value) => setForm(current => ({ ...current, [name]: value }));

  const start = async event => {
    event.preventDefault();
    const body = exercise === "1"
      ? { capacity: Number(form.capacity) }
      : exercise === "3"
        ? { producers: Number(form.producers), consumers: Number(form.consumers), piecesPerWorker: Number(form.piecesPerWorker) }
        : exercise === "4"
          ? { north: Number(form.north), south: Number(form.south), crossingMillis: Number(form.crossingMillis) }
          : {};
    await fetch(config.url + config.start, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    refresh();
  };

  const controls = exercise === "1"
    ? <label>Capacidad del estacionamiento
        <select value={form.capacity} onChange={e => update("capacity", e.target.value)}>
          <option value="1">1 espacio</option><option value="4">4 espacios</option><option value="10">10 espacios</option>
        </select>
      </label>
    : exercise === "3"
      ? <>
          <label>Productores<input type="number" min="1" max="10" value={form.producers} onChange={e => update("producers", e.target.value)} /></label>
          <label>Consumidores<input type="number" min="1" max="10" value={form.consumers} onChange={e => update("consumers", e.target.value)} /></label>
          <label>Piezas por productor<input type="number" min="1" max="50" value={form.piecesPerWorker} onChange={e => update("piecesPerWorker", e.target.value)} /></label>
        </>
      : exercise === "4"
        ? <>
            <label>Vehículos al norte<input type="number" min="1" max="30" value={form.north} onChange={e => update("north", e.target.value)} /></label>
            <label>Vehículos al sur<input type="number" min="1" max="30" value={form.south} onChange={e => update("south", e.target.value)} /></label>
            <label>Tiempo de cruce (ms)<input type="number" min="50" max="5000" value={form.crossingMillis} onChange={e => update("crossingMillis", e.target.value)} /></label>
          </>
        : <p className="muted">Configuración fija del ejercicio.</p>;

  return <main>
    <header><span className="eyebrow">SISTEMAS DISTRIBUIDOS</span><h1>Laboratorio de concurrencia</h1></header>
    <nav>{Object.entries(configs).map(([key, item]) => <button className={exercise === key ? "active" : ""} onClick={() => setExercise(key)} key={key}>Ejercicio {key}<small>{item.name}</small></button>)}</nav>
    <section className="grid">
      <div className="card"><h2>{config.name}</h2><p className="muted">{config.description}</p><form onSubmit={start}>{controls}<button className="start">Iniciar simulación</button></form></div>
      <div className="card"><h2>Estado <i className={data.running ? "live" : ""}>{data.running ? "EN EJECUCIÓN" : "DETENIDO"}</i></h2><div className="stats">{Object.entries(data).filter(([key]) => !["running", "error"].includes(key)).map(([key, value]) => <div key={key}><strong>{String(value)}</strong><span>{key}</span></div>)}</div>{data.error && <p className="error">{data.error}</p>}</div>
    </section>
    <section className="card log"><h2>Eventos de sincronización</h2>{events.length ? events.slice().reverse().map((item, index) => <p key={index}><time>{new Date(item.timestamp).toLocaleTimeString()}</time>{item.message}</p>) : <p className="muted">Inicia una simulación para observar los hilos.</p>}</section>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
