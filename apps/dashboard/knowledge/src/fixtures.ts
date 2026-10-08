export type Relation =
  'calls' | 'passes value' | 'reads state' | 'writes state' | 'uses type'
export type CodeLine = {
  text: string
  number: number
  change?: 'added' | 'removed'
}
export type Block = {
  id: string
  title: string
  file: string
  lines: CodeLine[]
  x: number
  y: number
}
export type Connection = {
  id: string
  source: string
  target: string
  type: Relation
  value?: string
}
export type Fixture = {
  id: string
  title: string
  revision: string
  provenance: string
  demo: boolean
  scenario: string
  target: string
  blocks: Block[]
  connections: Connection[]
}

function block(
  id: string,
  title: string,
  file: string,
  start: number,
  source: string,
  x: number,
  y: number,
): Block {
  let number = start
  return {
    id,
    title,
    file,
    x,
    y,
    lines: source.split('\n').map((raw) => {
      const change: CodeLine['change'] = raw.startsWith('+')
        ? 'added'
        : raw.startsWith('-')
          ? 'removed'
          : undefined
      const line = { text: change ? raw.slice(1) : raw, number, change }
      if (change !== 'removed') number++
      return line
    }),
  }
}

const link = (
  source: string,
  target: string,
  type: Relation,
  value?: string,
): Connection => ({ id: `${source}-${target}`, source, target, type, value })

export const practice: Fixture = {
  id: 'practice',
  title: 'A small greeting',
  revision: 'synthetic / practice',
  demo: true,
  provenance:
    'Original synthetic example for navigation practice; not a historical change.',
  scenario:
    'The input name is " Ada ". Explain the returned greeting and cite the relevant lines.',
  target: 'greet',
  blocks: [
    block(
      'greet',
      'greet',
      'greeting.ts',
      1,
      'export function greet(name: string) {\n  return `Hello, ${normalize(name)}`;\n}',
      0,
      0,
    ),
    block(
      'normalize',
      'normalize',
      'names.ts',
      1,
      'export function normalize(name: string) {\n  return name.trim();\n}',
      0,
      240,
    ),
  ],
  connections: [link('greet', 'normalize', 'passes value', 'name')],
}

export const examples: Record<'A' | 'B', Fixture> = {
  A: {
    id: 'A',
    title: 'Reserve an order',
    revision: 'synthetic / rehearsal A',
    demo: true,
    provenance:
      'Original synthetic fixture. Replace with an audited historical change before collecting pilot data.',
    scenario:
      'An order requests 3 units of SKU "book". There are 5 units available. Trace the request through the change and describe its observable result.',
    target: 'placeOrder',
    blocks: [
      block(
        'entry',
        'placeOrder',
        'orders.ts',
        8,
        'export function placeOrder(input: OrderInput) {\n  const order = validateOrder(input);\n  reserve(order.sku, order.quantity);\n  return receipt(order);\n}',
        0,
        0,
      ),
      block(
        'validate',
        'validateOrder',
        'validation.ts',
        4,
        'export function validateOrder(input: OrderInput) {\n  if (input.quantity <= 0) throw new Error("quantity");\n  return { ...input, quantity: Math.floor(input.quantity) };\n}',
        850,
        0,
      ),
      block(
        'reserve',
        'reserve',
        'inventory.ts',
        12,
        'export function reserve(sku: string, quantity: number) {\n  const available = stock.get(sku) ?? 0;\n  if (quantity > available) throw new Error("stock");\n-  stock.set(sku, available - quantity);\n+  stock.set(sku, quantity);\n}',
        0,
        310,
      ),
      block(
        'receipt',
        'receipt',
        'orders.ts',
        21,
        'export function receipt(order: OrderInput) {\n  return { sku: order.sku, reserved: order.quantity };\n}',
        850,
        310,
      ),
      block(
        'stock',
        'stock',
        'inventory.ts',
        1,
        'export const stock = new Map<string, number>([\n  ["book", 5],\n]);',
        0,
        650,
      ),
      block(
        'type',
        'OrderInput',
        'types.ts',
        1,
        'export interface OrderInput {\n  sku: string;\n  quantity: number;\n}',
        850,
        650,
      ),
    ],
    connections: [
      link('entry', 'validate', 'passes value', 'input'),
      link('entry', 'reserve', 'passes value', 'sku, quantity'),
      link('entry', 'receipt', 'passes value', 'order'),
      link('reserve', 'stock', 'reads state', 'available'),
      link('reserve', 'stock', 'writes state', 'stored quantity'),
      link('validate', 'type', 'uses type', 'OrderInput'),
    ].map((edge, i) => ({ ...edge, id: `A-${i}` })),
  },
  B: {
    id: 'B',
    title: 'Apply a store credit',
    revision: 'synthetic / rehearsal B',
    demo: true,
    provenance:
      'Original synthetic fixture. Replace with an audited historical change before collecting pilot data.',
    scenario:
      'Customer "ada" has 50 credits. A purchase costs 20 credits. Trace the request through the change and describe its observable result.',
    target: 'purchase',
    blocks: [
      block(
        'entry',
        'purchase',
        'checkout.ts',
        6,
        'export function purchase(input: PurchaseInput) {\n  const amount = validateAmount(input.amount);\n  debit(input.customer, amount);\n  return confirmation(input.customer, amount);\n}',
        0,
        0,
      ),
      block(
        'validate',
        'validateAmount',
        'validation.ts',
        3,
        'export function validateAmount(amount: number) {\n  if (!Number.isFinite(amount) || amount <= 0) {\n    throw new Error("amount");\n  }\n  return Math.round(amount);\n}',
        850,
        0,
      ),
      block(
        'debit',
        'debit',
        'credits.ts',
        11,
        'export function debit(customer: string, amount: number) {\n  const balance = credits.get(customer) ?? 0;\n  if (amount > balance) throw new Error("balance");\n-  credits.set(customer, balance - amount);\n+  credits.set(customer, amount);\n}',
        0,
        310,
      ),
      block(
        'confirmation',
        'confirmation',
        'checkout.ts',
        20,
        'export function confirmation(customer: string, amount: number) {\n  return { customer, charged: amount };\n}',
        850,
        310,
      ),
      block(
        'credits',
        'credits',
        'credits.ts',
        1,
        'export const credits = new Map<string, number>([\n  ["ada", 50],\n]);',
        0,
        650,
      ),
      block(
        'type',
        'PurchaseInput',
        'types.ts',
        1,
        'export interface PurchaseInput {\n  customer: string;\n  amount: number;\n}',
        850,
        650,
      ),
    ],
    connections: [
      link('entry', 'validate', 'passes value', 'amount'),
      link('entry', 'debit', 'passes value', 'customer, amount'),
      link('entry', 'confirmation', 'passes value', 'customer, amount'),
      link('debit', 'credits', 'reads state', 'balance'),
      link('debit', 'credits', 'writes state', 'stored credit'),
      link('entry', 'type', 'uses type', 'PurchaseInput'),
    ].map((edge, i) => ({ ...edge, id: `B-${i}` })),
  },
}
