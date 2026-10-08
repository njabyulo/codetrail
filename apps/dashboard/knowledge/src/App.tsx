import { useEffect, useState } from 'react'
import { CodeView } from './CodeView'
import { examples, practice } from './fixtures'
import {
  assignments,
  createSession,
  finishTask,
  interrupted,
  loadSession,
  remainingMs,
  startTask,
  STORAGE_KEY,
  type Answers,
  type Session,
  type View,
} from './study'
import './App.css'

function download(session: Session) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          ...session,
          fixtureManifest: session.tasks.map((task) => ({
            id: task.example,
            revision: examples[task.example].revision,
            provenance: examples[task.example].provenance,
            demo: examples[task.example].demo,
          })),
          exportedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `codetrail-${session.participant}-${session.id}.json`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function readInitial(): { session: Session | null; error: string } {
  try {
    const session = loadSession()
    const expired =
      session?.phase === 'task' &&
      remainingMs(session.tasks[session.index], Date.now()) === 0
    return { session: expired ? finishTask(session!) : session, error: '' }
  } catch {
    return {
      session: null,
      error:
        'The saved session could not be loaded. Clear the browser’s saved session before starting again.',
    }
  }
}
const questions: {
  key: keyof Answers
  title: string
  prompt: string
  placeholder: string
}[] = [
  {
    key: 'dependencies',
    title: 'Identify dependencies',
    prompt: 'What does the target function depend on for this behavior?',
    placeholder: 'Functions, state, and relevant file/line references…',
  },
  {
    key: 'flow',
    title: 'Trace the data',
    prompt:
      'Follow the supplied input through transformations and branches to the observable result.',
    placeholder: 'Input → transformations → outcome, with evidence…',
  },
  {
    key: 'review',
    title: 'Review the change',
    prompt:
      'Does the change introduce a defect? If so, give the hunk, trigger, and downstream consequence.',
    placeholder: 'Your finding and supporting file/line references…',
  },
]

export default function App() {
  const [initial] = useState(readInitial)
  const [session, setSession] = useState<Session | null>(initial.session)
  const [error, setError] = useState(initial.error)
  const [participant, setParticipant] = useState('1')
  const [previewView, setPreviewView] = useState<View>('graph')
  const [practiceView, setPracticeView] = useState<View>('graph')
  const [now, setNow] = useState(() => Date.now())
  const [confirmReset, setConfirmReset] = useState(false)
  const task = session?.tasks[session.index]
  const fixture =
    session?.phase === 'practice'
      ? practice
      : task
        ? examples[task.example]
        : examples.A
  const active = session?.phase === 'task'
  const remaining = task ? remainingMs(task, now) : 0

  useEffect(() => {
    if (!session) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      queueMicrotask(() =>
        setError(
          'Drafts cannot be saved in this browser. Export your session before closing the page.',
        ),
      )
    }
  }, [session])
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => {
      const time = Date.now()
      setNow(time)
      setSession((current) =>
        current?.phase === 'task' &&
        remainingMs(current.tasks[current.index], time) === 0
          ? finishTask(current, time)
          : current,
      )
    }, 250)
    const visibility = () => {
      if (document.hidden)
        setSession((current) =>
          current ? interrupted(current, 'browser tab hidden') : current,
        )
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [active])

  function begin() {
    setNow(Date.now())
    setSession((current) => (current ? startTask(current) : current))
  }
  function answer(key: keyof Answers, value: string) {
    setSession((current) => {
      if (!current || current.phase !== 'task') return current
      if (remainingMs(current.tasks[current.index], Date.now()) === 0)
        return finishTask(current)
      return {
        ...current,
        tasks: current.tasks.map((item, i) =>
          i === current.index
            ? { ...item, answers: { ...item.answers, [key]: value } }
            : item,
        ),
      }
    })
  }
  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setSession(null)
      setError('')
      setConfirmReset(false)
    } catch {
      setError('Unable to clear saved data in this browser.')
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(event) => event.preventDefault()}
        >
          <span className="brand-mark">⌘</span>code<span>trail</span>
          <span className="brand-divider" />
          <small>READING LAB</small>
        </a>
        <div className="header-right">
          <span className="status-dot" />
          LOCAL EXPERIMENT <span className="version">PILOT / 01</span>
        </div>
      </header>
      <div className="rehearsal-banner">
        <span>DEMO FIXTURES</span> Rehearsal only. Replace synthetic examples
        with audited historical changes before collecting pilot results.
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {!session ? (
        <main className="setup-page">
          <section className="intro">
            <div className="eyebrow">A SMALL EXPERIMENT IN UNDERSTANDING</div>
            <h1>
              Follow the code.
              <br />
              <span>Test the trail.</span>
            </h1>
            <p>
              Does seeing the connections help us understand a change? Compare
              two reading formats, with the same code and the same evidence.
            </p>
            <div className="experiment-stats">
              <div>
                <strong>02</strong>
                <span>code examples</span>
              </div>
              <div>
                <strong>04</strong>
                <span>participants</span>
              </div>
              <div>
                <strong>
                  12<span> min</span>
                </strong>
                <span>per task</span>
              </div>
            </div>
            <div className="session-card">
              <div className="eyebrow">FACILITATOR SETUP</div>
              <h2>Start a rehearsal</h2>
              <label htmlFor="participant">Participant assignment</label>
              <select
                id="participant"
                value={participant}
                onChange={(event) => setParticipant(event.target.value)}
              >
                {Object.keys(assignments).map((id) => (
                  <option key={id} value={id}>
                    Participant {id}
                  </option>
                ))}
              </select>
              <div className="assignment-preview">
                {assignments[participant].map((item, i) => (
                  <span key={i}>
                    {i + 1}. Example {item.example} <b>{item.view}</b>
                  </span>
                ))}
              </div>
              <button
                className="primary"
                disabled={Boolean(error)}
                onClick={() => setSession(createSession(participant))}
              >
                Begin with practice <span>↗</span>
              </button>
              <p className="microcopy">
                Drafts stay in this browser. Export results at the end.
              </p>
              {error && (
                <button className="text-button" onClick={reset}>
                  Clear incompatible saved session
                </button>
              )}
            </div>
          </section>
          <section className="preview-card">
            <div className="workspace-bar">
              <div>
                <span className="eyebrow">PRESENTATION PREVIEW</span>
                <h2>Same code. Two perspectives.</h2>
              </div>
              <div className="view-toggle">
                {(['linear', 'graph'] as const).map((view) => (
                  <button
                    aria-pressed={previewView === view}
                    className={previewView === view ? 'selected' : ''}
                    key={view}
                    onClick={() => setPreviewView(view)}
                  >
                    {view === 'graph' ? '◈ Graph' : '≡ Linear'}
                  </button>
                ))}
              </div>
            </div>
            <CodeView fixture={practice} view={previewView} />
            <div className="preview-caption">
              <span className="status-dot" /> Same snippets · Same relationships
              · Different arrangement
            </div>
          </section>
        </main>
      ) : (
        <>
          <nav className="study-progress" aria-label="Session progress">
            <div className="participant-badge">
              P{session.participant}
              <span>REHEARSAL SESSION</span>
            </div>
            {['Practice', 'Task 01', 'Task 02', 'Reflection'].map((step, i) => {
              const current =
                session.phase === 'practice'
                  ? 0
                  : ['feedback', 'complete'].includes(session.phase)
                    ? 3
                    : session.index + 1
              return (
                <div
                  key={step}
                  className={`progress-step ${i === current ? 'current' : i < current ? 'done' : ''}`}
                >
                  <span>{i < current ? '✓' : `0${i + 1}`}</span>
                  {step}
                </div>
              )
            })}
            <button className="text-button" onClick={() => download(session)}>
              Export draft ↓
            </button>
          </nav>
          {['practice', 'task'].includes(session.phase) ? (
            <main className="study-workspace">
              <section className="source-panel">
                <div className="workspace-bar">
                  <div>
                    <div className="eyebrow">
                      {session.phase === 'practice'
                        ? 'NAVIGATION PRACTICE'
                        : `EXAMPLE ${task?.example} / ${task?.view.toUpperCase()} VIEW`}
                    </div>
                    <h2>{fixture.title}</h2>
                  </div>
                  {session.phase === 'practice' ? (
                    <div className="view-toggle">
                      {(['linear', 'graph'] as const).map((view) => (
                        <button
                          key={view}
                          aria-pressed={practiceView === view}
                          className={practiceView === view ? 'selected' : ''}
                          onClick={() => setPracticeView(view)}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`timer ${remaining < 60000 ? 'urgent' : ''}`}
                      role="timer"
                      aria-label="Time remaining"
                    >
                      {String(Math.floor(remaining / 60000)).padStart(2, '0')}
                      <span>:</span>
                      {String(Math.floor(remaining / 1000) % 60).padStart(
                        2,
                        '0',
                      )}
                    </div>
                  )}
                </div>
                <CodeView
                  fixture={fixture}
                  view={
                    session.phase === 'practice' ? practiceView : task!.view
                  }
                />
                <div className="source-footer">
                  {fixture.revision}
                  <span>
                    <i className="diff-dot" /> added{' '}
                    <i className="diff-dot removed-dot" /> removed
                  </span>
                </div>
              </section>
              <aside className="task-panel">
                <div className="eyebrow">
                  {session.phase === 'practice'
                    ? 'GET COMFORTABLE'
                    : 'YOUR READING TASK'}
                </div>
                <h2>
                  {session.phase === 'practice'
                    ? 'Explore both formats'
                    : `Follow ${fixture.target}`}
                </h2>
                <div className="scenario">
                  <span>INPUT / SCENARIO</span>
                  <p>{fixture.scenario}</p>
                </div>
                {session.phase === 'practice' ? (
                  <>
                    <p className="muted">
                      Try scrolling the linear view, then pan and zoom the
                      graph. Use + / − or the fit-view control to read the code.
                    </p>
                    <p className="muted">
                      In each timed task, cite file and line references. No
                      correctness feedback is provided. Your assigned format
                      cannot be switched.
                    </p>
                    <button
                      className="primary"
                      onClick={() => setSession({ ...session, phase: 'ready' })}
                    >
                      Practice complete →
                    </button>
                  </>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      setSession((current) =>
                        current ? finishTask(current) : current,
                      )
                    }}
                  >
                    {questions.map((question, i) => (
                      <label className="question" key={question.key}>
                        <span className="question-title">
                          <b>0{i + 1}</b>
                          {question.title}
                        </span>
                        <span className="question-prompt">
                          {question.prompt}
                        </span>
                        <textarea
                          value={task!.answers[question.key]}
                          onChange={(event) =>
                            answer(question.key, event.target.value)
                          }
                          placeholder={question.placeholder}
                          rows={3}
                        />
                      </label>
                    ))}
                    <button className="primary" type="submit">
                      Submit task →
                    </button>
                    <p className="microcopy">
                      Partial answers are saved at the time limit.
                    </p>
                  </form>
                )}
              </aside>
            </main>
          ) : (
            <main className="checkpoint">
              {session.phase === 'ready' && (
                <>
                  <div className="checkpoint-icon">◷</div>
                  <div className="eyebrow">READY WHEN YOU ARE</div>
                  <h1>Your first reading task</h1>
                  <p>
                    You have 12 minutes to explain dependencies, trace the
                    input, and review the change. Use only the supplied
                    materials. The timer starts when you continue.
                  </p>
                  <button className="primary" onClick={begin}>
                    Start task 01 →
                  </button>
                </>
              )}
              {session.phase === 'between' && (
                <>
                  <div className="checkpoint-icon">✓</div>
                  <div className="eyebrow">TASK 01 SAVED</div>
                  <h1>
                    {session.tasks[0].timedOut
                      ? 'Time limit reached.'
                      : 'First trail complete.'}
                  </h1>
                  <p>
                    Your answers have been recorded. Take a short break, then
                    continue to a different example and presentation. No answers
                    or correctness feedback are shown.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setNow(Date.now())
                      setSession(startTask({ ...session, index: 1 }))
                    }}
                  >
                    Start task 02 →
                  </button>
                </>
              )}
              {session.phase === 'feedback' && (
                <>
                  <div className="eyebrow">AFTER THE TASKS</div>
                  <h1>Reflect on the experience.</h1>
                  <p>
                    Preference helps us understand the experience; it is not the
                    primary success measure.
                  </p>
                  <form
                    className="feedback-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      setSession({ ...session, phase: 'complete' })
                    }}
                  >
                    <label>
                      Which format helped most?
                      <select
                        required
                        value={session.feedback.preference}
                        onChange={(event) =>
                          setSession({
                            ...session,
                            feedback: {
                              ...session.feedback,
                              preference: event.target.value,
                            },
                          })
                        }
                      >
                        <option value="">Choose a response</option>
                        <option value="linear">Linear</option>
                        <option value="graph">Graph</option>
                        <option value="neither">Neither / no preference</option>
                      </select>
                    </label>
                    <label>
                      What helped, and why?
                      <textarea
                        rows={3}
                        value={session.feedback.helped}
                        onChange={(event) =>
                          setSession({
                            ...session,
                            feedback: {
                              ...session.feedback,
                              helped: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Where was the presentation confusing? Did a connection
                      suggest behavior the code did not support?
                      <textarea
                        rows={3}
                        value={session.feedback.confusion}
                        onChange={(event) =>
                          setSession({
                            ...session,
                            feedback: {
                              ...session.feedback,
                              confusion: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <button className="primary">Finish session →</button>
                  </form>
                </>
              )}
              {session.phase === 'complete' && (
                <>
                  <div className="checkpoint-icon">✓</div>
                  <div className="eyebrow">SESSION COMPLETE</div>
                  <h1>Evidence, collected.</h1>
                  <p>
                    Export this rehearsal record before starting another
                    participant. Scores are assigned separately using the
                    private rubric.
                  </p>
                  <div className="result-summary">
                    {session.tasks.map((item, i) => (
                      <div key={i}>
                        <strong>Task 0{i + 1}</strong>
                        <span>
                          Example {item.example} / {item.view}
                        </span>
                        <span>
                          {Math.round((item.elapsedMs ?? 0) / 1000)}s ·{' '}
                          {item.timedOut ? 'timed out' : 'submitted'}
                        </span>
                        <span>
                          {item.interruptions.length
                            ? `${item.interruptions.length} interruption(s) — review timing`
                            : 'No recorded interruptions'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="primary" onClick={() => download(session)}>
                    Export session JSON ↓
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setConfirmReset(true)}
                  >
                    Start a new participant
                  </button>
                </>
              )}
            </main>
          )}
        </>
      )}
      <footer className="app-footer">
        <span>
          CODE TRAIL <span className="footer-slash">/</span> Read-only code.
          Measurable understanding.
        </span>
        {session && (
          <button className="text-button" onClick={() => setConfirmReset(true)}>
            Reset session
          </button>
        )}
        <span>EXPLANATION ≠ EXECUTION TRACE</span>
      </footer>
      {confirmReset && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <h2 id="reset-title">Clear this local session?</h2>
            <p>
              Export the record first if you want to keep it. Starting again
              removes this browser’s saved draft.
            </p>
            <div className="modal-actions">
              <button onClick={() => setConfirmReset(false)}>Cancel</button>
              {session && (
                <button onClick={() => download(session)}>Export JSON</button>
              )}
              <button className="primary" onClick={reset}>
                Clear session
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
