import { useMemo } from 'react'
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type NodeProps,
  type Node,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Block, Fixture, Connection } from './fixtures'
import type { View } from './study'

function highlight(text: string) {
  return text
    .split(
      /("[^"]*"|'[^']*'|\b(?:export|function|return|const|if|throw|new|interface|string|number)\b|\b\d+\b)/g,
    )
    .map((part, i) => (
      <span
        key={i}
        className={
          /^["']/.test(part)
            ? 'token-string'
            : /^(export|function|return|const|if|throw|new|interface|string|number)$/.test(
                  part,
                )
              ? 'token-keyword'
              : /^\d+$/.test(part)
                ? 'token-number'
                : undefined
        }
      >
        {part}
      </span>
    ))
}
export function CodeBlock({ block }: { block: Block }) {
  return (
    <article
      className="code-block"
      aria-label={`${block.title} in ${block.file}`}
    >
      <header className="block-header">
        <span className="function-icon">ƒ</span>
        <strong>{block.title}</strong>
        {block.lines.some((line) => line.change) && (
          <span className="changed-label">CHANGED</span>
        )}
      </header>
      <div className="file-reference">
        {block.file}{' '}
        <span>
          · L{block.lines[0]?.number}–{block.lines.at(-1)?.number}
        </span>
      </div>
      <pre>
        {block.lines.map((line, i) => (
          <div key={i} className={`code-line ${line.change ?? ''}`}>
            <span className="line-number">{line.number}</span>
            <span className="diff-sign">
              {line.change === 'added'
                ? '+'
                : line.change === 'removed'
                  ? '−'
                  : ' '}
            </span>
            <code>{highlight(line.text)}</code>
          </div>
        ))}
      </pre>
    </article>
  )
}
type CodeNode = Node<{ block: Block }, 'code'>
function GraphNode({ data }: NodeProps<CodeNode>) {
  return (
    <div className="graph-code">
      {[30, 50, 70].map((percent) => (
        <Handle
          key={`top-${percent}`}
          id={`top-${percent}`}
          type="target"
          position={Position.Top}
          style={{ left: `${percent}%` }}
        />
      ))}
      <Handle id="left" type="target" position={Position.Left} />
      <CodeBlock block={data.block} />
      {[30, 50, 70].map((percent) => (
        <Handle
          key={`bottom-${percent}`}
          id={`bottom-${percent}`}
          type="source"
          position={Position.Bottom}
          style={{ left: `${percent}%` }}
        />
      ))}
      <Handle id="right" type="source" position={Position.Right} />
    </div>
  )
}
const nodeTypes = { code: GraphNode }
type RelationshipEdge = Edge<{ connection: Connection }, 'relationship'>
function GraphEdge(props: EdgeProps<RelationshipEdge>) {
  const [path, x, y] = getSmoothStepPath({
    ...props,
    borderRadius: 12,
    offset: 24,
  })
  const crossColumn = props.sourcePosition === Position.Right
  const labelX = crossColumn ? (props.sourceX + props.targetX) / 2 : x
  const labelY = crossColumn ? (props.sourceY + props.targetY) / 2 : y
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        style={props.style}
      />
      <EdgeLabelRenderer>
        <div
          className="edge-label"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <strong>{props.data?.connection.type}</strong>
          {props.data?.connection.value && (
            <span>{props.data.connection.value}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
const edgeTypes = { relationship: GraphEdge }
export function CodeView({ fixture, view }: { fixture: Fixture; view: View }) {
  const nodes = useMemo(
    () =>
      fixture.blocks.map((block) => ({
        id: block.id,
        type: 'code',
        position: { x: block.x, y: block.y },
        data: { block },
      })),
    [fixture],
  )
  const edges = useMemo(
    () =>
      fixture.connections.map((connection) => {
        const source = fixture.blocks.find(
          (block) => block.id === connection.source,
        )!
        const target = fixture.blocks.find(
          (block) => block.id === connection.target,
        )!
        const crossColumn = source.x !== target.x
        const parallel = fixture.connections.filter(
          (edge) =>
            edge.source === connection.source &&
            edge.target === connection.target,
        )
        const port =
          parallel.length > 1
            ? parallel.findIndex((edge) => edge.id === connection.id) === 0
              ? 30
              : 70
            : 50
        return {
          id: connection.id,
          source: connection.source,
          target: connection.target,
          sourceHandle: crossColumn ? 'right' : `bottom-${port}`,
          targetHandle: crossColumn ? 'left' : `top-${port}`,
          type: 'relationship',
          data: { connection },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6c9d99' },
          style: { stroke: '#6c9d99', strokeWidth: 1.5 },
        }
      }),
    [fixture],
  )
  if (view === 'linear')
    return (
      <div className="linear-view">
        <div className="relationship-list">
          <h3>Relationships</h3>
          {fixture.connections.map((edge) => (
            <p key={edge.id}>
              <strong>
                {
                  fixture.blocks.find((block) => block.id === edge.source)
                    ?.title
                }
              </strong>
              <span>
                {' '}
                → {edge.type}
                {edge.value ? ` · ${edge.value}` : ''} →{' '}
              </span>
              <strong>
                {
                  fixture.blocks.find((block) => block.id === edge.target)
                    ?.title
                }
              </strong>
            </p>
          ))}
        </div>
        {[...new Set(fixture.blocks.map((block) => block.file))].map((file) => (
          <section className="file-group" key={file}>
            <h3>{file}</h3>
            {fixture.blocks
              .filter((block) => block.file === file)
              .map((block) => (
                <CodeBlock key={block.id} block={block} />
              ))}
          </section>
        ))}
      </div>
    )
  return (
    <div className="graph-view" aria-label="Code relationship graph">
      <ReactFlow
        key={fixture.id}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.35}
        maxZoom={1.6}
        colorMode="dark"
      >
        <Background color="#263638" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
