export type Operator = '+' | '−' | '×' | '÷';

export type CalcState = {
  a: string | null;
  op: Operator | null;
  b: string | null;
  display: string;
  prev: string;
  typing: boolean;
  lastOp: Operator | null;
  lastB: string | null;
};

const INITIAL_STATE: CalcState = {
  a: null,
  op: null,
  b: null,
  display: '0',
  prev: '',
  typing: false,
  lastOp: null,
  lastB: null,
};

const MAX_DIGITS = 16;

function sanitizeNumberString(value: string): string {
  if (value === '' || value === '-') {
    return '0';
  }

  if (!Number.isFinite(Number(value))) {
    return 'Error';
  }

  const numeric = Number(value);

  if (Object.is(numeric, -0)) {
    return '0';
  }

  const precise = Number.parseFloat(numeric.toPrecision(12));
  const text = precise.toString();

  return text;
}

function appendDigit(source: string, digit: string): string {
  const current = source === 'Error' ? '0' : source;

  if (current === '0' && digit === '0') {
    return '0';
  }

  if (current === '0' && digit !== '0') {
    return digit;
  }

  if (current === '-0' && digit !== '0') {
    return `-${digit}`;
  }

  const normalized = current.replace('-', '').replace('.', '');
  if (normalized.length >= MAX_DIGITS) {
    return current;
  }

  return `${current}${digit}`;
}

function compute(aRaw: string, op: Operator, bRaw: string): string {
  const a = Number(aRaw);
  const b = Number(bRaw);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return 'Error';
  }

  let result: number;

  switch (op) {
    case '+':
      result = a + b;
      break;
    case '−':
      result = a - b;
      break;
    case '×':
      result = a * b;
      break;
    case '÷':
      if (b === 0) {
        return 'Error';
      }
      result = a / b;
      break;
    default:
      return 'Error';
  }

  return sanitizeNumberString(String(result));
}

export function clearAll(): CalcState {
  return { ...INITIAL_STATE };
}

export function inputDigit(state: CalcState, digit: string): CalcState {
  if (!/^\d$/.test(digit)) {
    return state;
  }

  if (state.display === 'Error') {
    return {
      ...clearAll(),
      display: digit,
      a: digit,
      typing: true,
    };
  }

  if (state.op) {
    const nextB = appendDigit(state.b ?? '0', digit);
    return {
      ...state,
      b: nextB,
      display: nextB,
      typing: true,
    };
  }

  const nextA = appendDigit(state.a ?? '0', digit);
  return {
    ...state,
    a: nextA,
    display: nextA,
    typing: true,
    prev: state.prev,
  };
}

export function inputDot(state: CalcState): CalcState {
  if (state.display === 'Error') {
    return {
      ...clearAll(),
      a: '0.',
      display: '0.',
      typing: true,
    };
  }

  if (state.op) {
    const source = state.b ?? '0';
    if (source.includes('.')) {
      return state;
    }

    const nextB = source === '' ? '0.' : `${source}.`;
    return {
      ...state,
      b: nextB,
      display: nextB,
      typing: true,
    };
  }

  const source = state.a ?? '0';
  if (source.includes('.')) {
    return state;
  }

  const nextA = source === '' ? '0.' : `${source}.`;
  return {
    ...state,
    a: nextA,
    display: nextA,
    typing: true,
  };
}

export function chooseOperator(state: CalcState, op: Operator): CalcState {
  if (state.display === 'Error') {
    return state;
  }

  if (!state.a) {
    return {
      ...state,
      a: state.display,
      op,
      prev: `${state.display} ${op}`,
      typing: false,
    };
  }

  if (state.op && state.b) {
    const result = compute(state.a, state.op, state.b);
    if (result === 'Error') {
      return {
        ...clearAll(),
        display: 'Error',
      };
    }

    return {
      ...state,
      a: result,
      b: null,
      op,
      display: result,
      prev: `${result} ${op}`,
      typing: false,
      lastOp: null,
      lastB: null,
    };
  }

  // If operator is pressed twice in a row, just replace it.
  return {
    ...state,
    op,
    prev: `${state.a} ${op}`,
    typing: false,
  };
}

export function backspace(state: CalcState): CalcState {
  if (state.display === 'Error') {
    return clearAll();
  }

  if (state.op && state.b !== null) {
    const trimmed = state.b.slice(0, -1);
    const nextB = trimmed === '' || trimmed === '-' ? '0' : trimmed;
    return {
      ...state,
      b: trimmed === '' ? null : nextB,
      display: nextB,
      typing: trimmed !== '',
    };
  }

  const source = state.a ?? state.display;
  const trimmed = source.slice(0, -1);
  const nextA = trimmed === '' || trimmed === '-' ? '0' : trimmed;

  return {
    ...state,
    a: nextA,
    display: nextA,
    typing: trimmed !== '',
  };
}

export function toggleSign(state: CalcState): CalcState {
  if (state.display === 'Error') {
    return state;
  }

  const flip = (value: string): string => {
    if (value === '0') {
      return '0';
    }
    return value.startsWith('-') ? value.slice(1) : `-${value}`;
  };

  if (state.op && state.b) {
    const nextB = flip(state.b);
    return {
      ...state,
      b: nextB,
      display: nextB,
    };
  }

  const base = state.a ?? state.display;
  const nextA = flip(base);
  return {
    ...state,
    a: nextA,
    display: nextA,
  };
}

export function percent(state: CalcState): CalcState {
  if (state.display === 'Error') {
    return state;
  }

  const convert = (value: string) => sanitizeNumberString(String(Number(value) / 100));

  if (state.op && state.b) {
    const nextB = convert(state.b);
    return {
      ...state,
      b: nextB,
      display: nextB,
    };
  }

  const base = state.a ?? state.display;
  const nextA = convert(base);
  return {
    ...state,
    a: nextA,
    display: nextA,
  };
}

export function equals(state: CalcState): CalcState {
  if (state.display === 'Error') {
    return state;
  }

  if (state.op && state.a && state.b) {
    const result = compute(state.a, state.op, state.b);
    if (result === 'Error') {
      return {
        ...clearAll(),
        display: 'Error',
      };
    }

    return {
      ...state,
      a: result,
      b: null,
      op: null,
      display: result,
      prev: `${state.a} ${state.op} ${state.b} =`,
      typing: false,
      lastOp: state.op,
      lastB: state.b,
    };
  }

  // Repeated equals applies the previous operation again (e.g. 2 + 3 = = -> 8).
  if (!state.op && state.a && state.lastOp && state.lastB) {
    const result = compute(state.a, state.lastOp, state.lastB);
    if (result === 'Error') {
      return {
        ...clearAll(),
        display: 'Error',
      };
    }

    return {
      ...state,
      a: result,
      display: result,
      prev: `${state.a} ${state.lastOp} ${state.lastB} =`,
      typing: false,
    };
  }

  return state;
}
