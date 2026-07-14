import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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
  const fileInputRef = useRef(null);

  useEffect(() => { fetchTranscripts(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, asking]);

  async function fetchTranscripts() {
    try {
      const data = await api.getTranscripts();
      setTranscripts(data.transcripts || []);
    } catch {
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
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    } catch {
      setError('Failed to delete transcript');
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || !selected || asking) return;
    const q = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { type: 'user', text: q }]);
    setAsking(true);
    try {
      const data = await api.askQuestion(selected.trans_id, q);
      setMessages(prev => [...prev, { type: 'ai', text: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setAsking(false);
    }
  }

  function handleSelect(t) {
    setSelected(t);
    setMessages([]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk(e);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">AI Research</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Powered by Groq · Llama 3.1
        </span>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="transcripts-layout">

        {/* Left panel */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Upload Transcript</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpload}>
                <input type="text" placeholder="Symbol (e.g. AAPL)"
                  value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} required />
                <input type="number" placeholder="Year (e.g. 2024)"
                  value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required />
                <select value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })}>
                  <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                </select>
                <input type="file" accept=".pdf" ref={fileInputRef}
                  onChange={e => setFile(e.target.files[0])} required
                  style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }} />
                <button type="submit" disabled={uploading}>
                  {uploading ? 'Processing PDF...' : 'Upload & Embed'}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Transcripts</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{transcripts.length} uploaded</span>
            </div>
            <div className="card-body" style={{ padding: '0.75rem' }}>
              {loading ? (
                <div className="loading" style={{ padding: '1.5rem' }}>Loading...</div>
              ) : transcripts.length === 0 ? (
                <div className="empty" style={{ padding: '1.5rem' }}>
                  <span className="empty-icon">📄</span>
                  No transcripts yet.
                </div>
              ) : (
                <div className="transcript-list">
                  {transcripts.map(t => (
                    <div
                      key={t.trans_id}
                      className={`t-item ${selected?.trans_id === t.trans_id ? 'selected' : ''}`}
                    >
                      <div onClick={() => handleSelect(t)} style={{ flex: 1 }}>
                        <div className="t-sym">{t.symbol}</div>
                        <div className="t-meta">{t.quarter} · {t.year}</div>
                      </div>
                      <button className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => handleDelete(t.trans_id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — chat */}
        {!selected ? (
          <div className="chat-placeholder-panel">
            <span className="chat-placeholder-icon">💬</span>
            <span>Select a transcript to start asking questions</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              The AI will answer based only on the transcript content
            </span>
          </div>
        ) : (
          <div className="chat-panel">
            <div className="chat-header">
              <div>
                <div className="chat-header-sym">{selected.symbol}</div>
                <div className="chat-header-meta">{selected.quarter} {selected.year} Earnings Transcript</div>
              </div>
              <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
                <span className="live-dot" style={{ width: 5, height: 5 }} /> RAG Active
              </span>
            </div>

            <div className="chat-messages">
              <div className="msg-row ai">
                <span className="msg-label">AI</span>
                <div className="msg-bubble ai">
                  Hello! I've analyzed the <strong>{selected.symbol} {selected.quarter} {selected.year}</strong> earnings transcript.
                  Ask me anything — revenue, guidance, key highlights, management commentary.
                </div>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`msg-row ${m.type}`}>
                  <span className="msg-label">{m.type === 'user' ? 'You' : 'AI'}</span>
                  <div className={`msg-bubble ${m.type}`}>
                    {m.type === 'ai' ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
                  </div>
                </div>
              ))}

              {asking && (
                <div className="msg-row ai">
                  <span className="msg-label">AI</span>
                  <div className="msg-bubble thinking">
                    Thinking
                    <span className="dots">
                      <span /><span /><span />
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="chat-footer">
              <form className="chat-input-row" onSubmit={handleAsk}>
                <input
                  type="text"
                  placeholder="Ask about revenue, guidance, risks..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={asking}
                />
                <button type="submit" disabled={asking || !question.trim()}>
                  Send →
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
