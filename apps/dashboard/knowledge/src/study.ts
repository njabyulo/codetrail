export type View = 'linear' | 'graph'
export type Assignment = { example: 'A' | 'B'; view: View }
export const assignments: Record<string, Assignment[]> = {
  '1': [
    { example: 'A', view: 'linear' },
    { example: 'B', view: 'graph' },
  ],
  '2': [
    { example: 'A', view: 'graph' },
    { example: 'B', view: 'linear' },
  ],
  '3': [
    { example: 'B', view: 'linear' },
    { example: 'A', view: 'graph' },
  ],
  '4': [
    { example: 'B', view: 'graph' },
    { example: 'A', view: 'linear' },
  ],
}
export const TASK_MS = 12 * 60 * 1000
export const STORAGE_KEY = 'codetrail.study.v1'
export type Answers = { dependencies: string; flow: string; review: string }
export const emptyAnswers = (): Answers => ({
  dependencies: '',
  flow: '',
  review: '',
})
export type Task = Assignment & {
  answers: Answers
  startedAt: number | null
  submittedAt: number | null
  elapsedMs: number | null
  timedOut: boolean
  interruptions: { at: number; reason: string }[]
}
export type Session = {
  schemaVersion: 1
  protocolVersion: 'pilot-v1'
  fixtureVersion: 'synthetic-v1'
  mode: 'rehearsal'
  id: string
  participant: string
  createdAt: number
  phase: 'practice' | 'ready' | 'task' | 'between' | 'feedback' | 'complete'
  index: number
  tasks: Task[]
  feedback: { preference: string; helped: string; confusion: string }
}
export function createSession(participant: string, now = Date.now()): Session {
  if (!assignments[participant])
    throw new Error('Unknown participant assignment')
  return {
    schemaVersion: 1,
    protocolVersion: 'pilot-v1',
    fixtureVersion: 'synthetic-v1',
    mode: 'rehearsal',
    id: crypto.randomUUID(),
    participant,
    createdAt: now,
    phase: 'practice',
    index: 0,
    tasks: assignments[participant].map((assignment) => ({
      ...assignment,
      answers: emptyAnswers(),
      startedAt: null,
      submittedAt: null,
      elapsedMs: null,
      timedOut: false,
      interruptions: [],
    })),
    feedback: { preference: '', helped: '', confusion: '' },
  }
}
export function startTask(session: Session, now = Date.now()): Session {
  if (session.tasks[session.index].startedAt !== null) return session
  return {
    ...session,
    phase: 'task',
    tasks: session.tasks.map((task, index) =>
      index === session.index ? { ...task, startedAt: now } : task,
    ),
  }
}
export function remainingMs(task: Task, now: number): number {
  return task.startedAt === null
    ? TASK_MS
    : Math.max(0, TASK_MS - (now - task.startedAt))
}
export function finishTask(session: Session, now = Date.now()): Session {
  const active = session.tasks[session.index]
  if (session.phase !== 'task' || active.startedAt === null) return session
  const timedOut = remainingMs(active, now) === 0
  return {
    ...session,
    phase: session.index === 0 ? 'between' : 'feedback',
    tasks: session.tasks.map((task, index) =>
      index === session.index
        ? {
            ...task,
            submittedAt: timedOut ? active.startedAt! + TASK_MS : now,
            elapsedMs: Math.min(TASK_MS, Math.max(0, now - active.startedAt!)),
            timedOut,
          }
        : task,
    ),
  }
}
export function interrupted(session: Session, reason: string): Session {
  if (session.phase !== 'task') return session
  return {
    ...session,
    tasks: session.tasks.map((task, i) =>
      i === session.index
        ? {
            ...task,
            interruptions: [...task.interruptions, { at: Date.now(), reason }],
          }
        : task,
    ),
  }
}
export function loadSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const value = JSON.parse(raw) as Session
  if (
    !value ||
    value.schemaVersion !== 1 ||
    value.protocolVersion !== 'pilot-v1' ||
    value.fixtureVersion !== 'synthetic-v1' ||
    value.mode !== 'rehearsal' ||
    typeof value.id !== 'string' ||
    !Number.isFinite(value.createdAt) ||
    !assignments[value.participant] ||
    !Array.isArray(value.tasks) ||
    value.tasks.length !== 2 ||
    !['practice', 'ready', 'task', 'between', 'feedback', 'complete'].includes(
      value.phase,
    ) ||
    ![0, 1].includes(value.index) ||
    !value.feedback ||
    !['preference', 'helped', 'confusion'].every(
      (key) =>
        typeof value.feedback[key as keyof Session['feedback']] === 'string',
    ) ||
    !value.tasks.every((task, i) => {
      const expected = assignments[value.participant][i]
      return (
        task &&
        task.example === expected.example &&
        task.view === expected.view &&
        task.answers &&
        ['dependencies', 'flow', 'review'].every(
          (key) => typeof task.answers[key as keyof Answers] === 'string',
        ) &&
        [task.startedAt, task.submittedAt, task.elapsedMs].every(
          (time) =>
            time === null ||
            (typeof time === 'number' && Number.isFinite(time)),
        ) &&
        typeof task.timedOut === 'boolean' &&
        Array.isArray(task.interruptions) &&
        task.interruptions.every(
          (item) =>
            item && Number.isFinite(item.at) && typeof item.reason === 'string',
        )
      )
    }) ||
    (value.phase === 'task' &&
      (value.tasks[value.index].startedAt === null ||
        value.tasks[value.index].submittedAt !== null))
  )
    throw new Error('Saved session is incompatible with this study version.')
  return interrupted(value, 'page reloaded or reopened')
}
