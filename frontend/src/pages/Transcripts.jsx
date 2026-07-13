import { useState, useEffect, useRef } from 'react';
import * as api from '../api';

export default function Transcripts() {
  const [transcripts, setTranscripts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [form, setForm] = useState({ symbol: '', year: '', quarter: 'Q1' });
  const [file, setFile] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchTranscripts() {
    try {
      const data = await api.getTranscripts();
      setTranscripts(data.transcripts || []);
    } catch (err) {
      setError('Failed to load transcripts');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('symbol', form.symbol.toUpperCase());
      formData.append('year', form.year);
      formData.append('quarter', form.quarter);
      await api.uploadTranscript(formData);
      setForm({ symbol: '', year: '', quarter: 'Q1' });
      setFile(null);
      e.target.reset();
      await fetchTranscripts();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTranscript(id);
      setTranscripts(prev => prev.filter(t => t.trans_id !== id));
      if (selected?.trans_id === id) { setSelected(null); setMessages([]); }
    } catch (err) {
      setError('Failed to delete transcript');
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || !selected) return;
    const q = question;
    setQuestion('');
    setMessages(prev => [...prev, { type: 'question', text: q }]);
    setAsking(true);
    try {
      const data = await api.askQuestion(selected.trans_id, q);
      setMessages(prev => [...prev, { type: 'answer', text: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'answer', text: 'Error: ' + (err.response?.data?.message || 'Failed to get answer') }]);
    } finally {
      setAsking(false);
    }
  }

  function handleSelect(t) {
    setSelected(t);
    setMessages([]);
  }

  return (
    <div className="page">
      <h2>Earnings Transcripts</h2>
      {error && <div className="error">{error}</div>}

      <div className="transcripts-layout">
        {/* Left panel */}
        <div>
          <div className="card">
            <h3>Upload PDF</h3>
            <form onSubmit={handleUpload}>
              <input
                type="text"
                placeholder="Symbol (e.g. AAPL)"
                value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Year (e.g. 2024)"
                value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}
                required
              />
              <select value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })}>
                <option>Q1</option>
                <option>Q2</option>
                <option>Q3</option>
                <option>Q4</option>
              </select>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files[0])}
                required
              />
              <button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>Uploaded Transcripts</h3>
            {loading ? (
              <div className="empty">Loading...</div>
            ) : transcripts.length === 0 ? (
              <div className="empty">No transcripts yet.</div>
            ) : (
              transcripts.map(t => (
                <div
                  key={t.trans_id}
                  className={`transcript-item ${selected?.trans_id === t.trans_id ? 'selected' : ''}`}
                >
                  <div className="transcript-info" onClick={() => handleSelect(t)}>
                    <div className="t-symbol">{t.symbol}</div>
                    <div className="t-meta">{t.quarter} {t.year}</div>
                  </div>
                  <button className="btn-delete" onClick={() => handleDelete(t.trans_id)}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel — chat */}
        {!selected ? (
          <div className="chat-placeholder">Select a transcript to start asking questions</div>
        ) : (
          <div className="card">
            <h3>{selected.symbol} — {selected.quarter} {selected.year}</h3>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty">Ask a question about this transcript.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.type}`}>{m.text}</div>
              ))}
              {asking && <div className="chat-bubble answer" style={{ color: 'var(--text-dim)' }}>Thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-row" onSubmit={handleAsk}>
              <input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={asking}
              />
              <button type="submit" disabled={asking || !question.trim()}>Ask</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
