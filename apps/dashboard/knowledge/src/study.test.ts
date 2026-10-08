import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assignments,
  createSession,
  finishTask,
  interrupted,
  loadSession,
  remainingMs,
  startTask,
  TASK_MS,
} from './study'
import { examples, practice } from './fixtures'

describe('counterbalanced study assignments', () => {
  it('exposes each participant to each example and format exactly once', () => {
    for (const sequence of Object.values(assignments)) {
      expect(new Set(sequence.map((task) => task.example)).size).toBe(2)
      expect(new Set(sequence.map((task) => task.view)).size).toBe(2)
    }
    for (const example of ['A', 'B']) {
      const tasks = Object.values(assignments)
        .flat()
        .filter((task) => task.example === example)
      expect(tasks.filter((task) => task.view === 'graph')).toHaveLength(2)
      expect(tasks.filter((task) => task.view === 'linear')).toHaveLength(2)
    }
  })
})

describe('timed task integrity', () => {
  it('starts the clock only when a task begins and preserves responses on submission', () => {
    const session = createSession('1', 1000)
    expect(session.tasks[0].startedAt).toBeNull()
    const started = startTask(session, 2000)
    started.tasks[0].answers.review = 'A finding with supporting references'
    const finished = finishTask(started, 6500)
    expect(finished.phase).toBe('between')
    expect(finished.tasks[0].elapsedMs).toBe(4500)
    expect(finished.tasks[0].timedOut).toBe(false)
    expect(finished.tasks[0].answers.review).toBe(
      started.tasks[0].answers.review,
    )
    expect(finished.tasks[1].startedAt).toBeNull()
  })
  it('caps time at the deadline when a suspended or reloaded page returns late', () => {
    const session = startTask(createSession('2'), 5000)
    session.tasks[0].answers.flow = 'Partial response'
    expect(remainingMs(session.tasks[0], 5000 + TASK_MS + 90000)).toBe(0)
    const finished = finishTask(session, 5000 + TASK_MS + 90000)
    expect(finished.tasks[0]).toMatchObject({
      timedOut: true,
      elapsedMs: TASK_MS,
      submittedAt: 5000 + TASK_MS,
    })
    expect(finished.tasks[0].answers.flow).toBe('Partial response')
    expect(finishTask(finished)).toBe(finished)
  })
  it('records interruptions without resetting the clock', () => {
    const started = startTask(createSession('3'), 1000)
    const restored = interrupted(started, 'page reloaded')
    expect(restored.tasks[0].startedAt).toBe(1000)
    expect(restored.tasks[0].interruptions).toHaveLength(1)
    expect(remainingMs(restored.tasks[0], 61000)).toBe(TASK_MS - 60000)
    expect(startTask(restored, 61000)).toBe(restored)
  })
  it('finishes the second task into feedback and leaves the first record intact', () => {
    const first = finishTask(startTask(createSession('4'), 1000), 2000)
    const second = finishTask(startTask({ ...first, index: 1 }, 3000), 4500)
    expect(second.phase).toBe('feedback')
    expect(second.tasks[0]).toEqual(first.tasks[0])
    expect(second.tasks[1].elapsedMs).toBe(1500)
  })
})

describe('saved-session recovery', () => {
  afterEach(() => vi.unstubAllGlobals())
  function saved(value: unknown) {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(value) })
  }
  it('restores saved drafts and records an active reload without restarting time', () => {
    const session = startTask(createSession('2'), 1000)
    session.tasks[0].answers.flow = 'Draft evidence'
    saved(session)
    const restored = loadSession()!
    expect(restored.tasks[0].answers.flow).toBe('Draft evidence')
    expect(restored.tasks[0].startedAt).toBe(1000)
    expect(restored.tasks[0].interruptions).toHaveLength(1)
  })
  it('rejects incompatible fixtures, altered assignments, and malformed records', () => {
    const session = createSession('1')
    for (const value of [
      null,
      {},
      { ...session, fixtureVersion: 'other' },
      { ...session, tasks: [session.tasks[1], session.tasks[0]] },
      {
        ...session,
        tasks: [{ ...session.tasks[0], answers: null }, session.tasks[1]],
      },
    ]) {
      saved(value)
      expect(() => loadSession()).toThrow()
    }
  })
})

describe('presentation fixtures', () => {
  it('contains only resolvable edges and distinct block and edge identifiers', () => {
    for (const fixture of [practice, ...Object.values(examples)]) {
      const ids = new Set(fixture.blocks.map((block) => block.id))
      expect(ids.size).toBe(fixture.blocks.length)
      expect(new Set(fixture.connections.map((edge) => edge.id)).size).toBe(
        fixture.connections.length,
      )
      for (const edge of fixture.connections) {
        expect(ids.has(edge.source)).toBe(true)
        expect(ids.has(edge.target)).toBe(true)
      }
      expect(fixture.demo).toBe(true)
    }
  })
})
