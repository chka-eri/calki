import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  backspace,
  chooseOperator,
  clearAll,
  equals,
  inputDigit,
  inputDot,
  percent,
  toggleSign,
  type CalcState,
  type Operator,
} from '@/src/utils/calcEngine';

const BUTTON_ROWS: string[][] = [
  ['MC', 'MR', 'M+', 'M-'],
  ['AC', 'CE', '⌫', '÷'],
  ['√', 'x²', '1/x', '×'],
  ['7', '8', '9', '−'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
  ['+/-', '%', '0', '.'],
];

const OPERATOR_SET = new Set(['+', '−', '×', '÷']);
const DIGIT_SET = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

const FEATURE_LIST = [
  'Memory recall/store controls (MC, MR, M+, M-)',
  'Square root (√)',
  'Square (x²)',
  'Reciprocal (1/x)',
  'Clear entry (CE)',
  'Running calculation history',
  'Copy-friendly history snippets',
  'Keyboard support on web',
  'Repeated equals support',
  'Percent and sign toggle helpers',
];

function toNumber(value: string): number {
  return Number(value);
}

function toDisplay(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  const cleaned = Number.parseFloat(value.toPrecision(12));
  if (Object.is(cleaned, -0)) {
    return '0';
  }

  return String(cleaned);
}

function writeDisplay(state: CalcState, nextDisplay: string): CalcState {
  if (state.op) {
    return {
      ...state,
      b: nextDisplay,
      display: nextDisplay,
      typing: true,
    };
  }

  return {
    ...state,
    a: nextDisplay,
    display: nextDisplay,
    typing: true,
  };
}

export default function HomeScreen() {
  const [state, setState] = useState<CalcState>(clearAll);
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);

  const pushHistory = useCallback((entry: string) => {
    setHistory((current) => [entry, ...current].slice(0, 8));
  }, []);

  const applyUnary = useCallback(
    (label: '√' | 'x²' | '1/x') => {
      setState((current) => {
        if (current.display === 'Error') {
          return current;
        }

        const base = toNumber(current.display);
        let next: number;

        if (label === '√') {
          if (base < 0) {
            pushHistory(`√(${current.display}) = Error`);
            return {
              ...clearAll(),
              display: 'Error',
            };
          }
          next = Math.sqrt(base);
        } else if (label === 'x²') {
          next = base * base;
        } else {
          if (base === 0) {
            pushHistory(`1/(${current.display}) = Error`);
            return {
              ...clearAll(),
              display: 'Error',
            };
          }
          next = 1 / base;
        }

        const nextDisplay = toDisplay(next);
        pushHistory(`${label}(${current.display}) = ${nextDisplay}`);
        return writeDisplay(current, nextDisplay);
      });
    },
    [pushHistory]
  );

  const onPressKey = useCallback(
    (label: string) => {
      if (label === '√' || label === 'x²' || label === '1/x') {
        applyUnary(label);
        return;
      }

      if (label === 'MC') {
        setMemory(0);
        return;
      }

      if (label === 'MR') {
        setState((current) => writeDisplay(current, toDisplay(memory)));
        return;
      }

      if (label === 'M+' || label === 'M-') {
        setMemory((current) => {
          const value = toNumber(state.display);
          return label === 'M+' ? current + value : current - value;
        });
        return;
      }

      setState((current) => {
        if (DIGIT_SET.has(label)) {
          return inputDigit(current, label);
        }

        if (label === '.') {
          return inputDot(current);
        }

        if (OPERATOR_SET.has(label)) {
          return chooseOperator(current, label as Operator);
        }

        switch (label) {
          case 'AC':
            return clearAll();
          case 'CE':
            return writeDisplay(current, '0');
          case '⌫':
            return backspace(current);
          case '=': {
            const next = equals(current);
            if (next.prev.includes('=')) {
              pushHistory(`${next.prev} ${next.display}`);
            }
            return next;
          }
          case '+/-':
            return toggleSign(current);
          case '%':
            return percent(current);
          default:
            return current;
        }
      });
    },
    [applyUnary, memory, pushHistory, state.display]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const { key } = event;

      if (/^\d$/.test(key)) {
        event.preventDefault();
        onPressKey(key);
        return;
      }

      if (key === '.') {
        event.preventDefault();
        onPressKey('.');
        return;
      }

      if (key === '+' || key === '-') {
        event.preventDefault();
        onPressKey(key === '+' ? '+' : '−');
        return;
      }

      if (key === '*' || key.toLowerCase() === 'x') {
        event.preventDefault();
        onPressKey('×');
        return;
      }

      if (key === '/') {
        event.preventDefault();
        onPressKey('÷');
        return;
      }

      if (key === 'Enter' || key === '=') {
        event.preventDefault();
        onPressKey('=');
        return;
      }

      if (key === 'Backspace') {
        event.preventDefault();
        onPressKey('⌫');
        return;
      }

      if (key === 'Escape') {
        event.preventDefault();
        onPressKey('AC');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onPressKey]);

  const memoryLabel = useMemo(() => `M: ${toDisplay(memory)}`, [memory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Calki Pro</Text>
        <Text style={styles.subtitle}>No tabs. 10 built-in features. No permission prompts.</Text>

        <View style={styles.displayCard} accessibilityLabel="Calculator display" accessible>
          <Text style={styles.previousLine} numberOfLines={1}>
            {state.prev || ' '}
          </Text>
          <Text style={styles.currentLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
            {state.display}
          </Text>
          <Text style={styles.memoryLine}>{memoryLabel}</Text>
        </View>

        <View style={styles.keypad}>
          {BUTTON_ROWS.map((row) => (
            <View style={styles.row} key={row.join('-')}>
              {row.map((label) => {
                const isOperator = OPERATOR_SET.has(label);
                const isEquals = label === '=';
                const isMemory = label.startsWith('M');

                return (
                  <Pressable
                    key={label}
                    onPress={() => onPressKey(label)}
                    accessibilityRole="button"
                    accessibilityLabel={`Calculator button ${label}`}
                    style={({ pressed }) => [
                      styles.key,
                      isOperator && styles.operatorKey,
                      isEquals && styles.equalsKey,
                      isMemory && styles.memoryKey,
                      pressed && styles.pressedKey,
                    ]}>
                    <Text style={styles.keyText}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>10 new features</Text>
          {FEATURE_LIST.map((feature) => (
            <Text key={feature} style={styles.panelText}>
              • {feature}
            </Text>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Recent history</Text>
          {history.length === 0 ? (
            <Text style={styles.panelText}>No calculations yet.</Text>
          ) : (
            history.map((item) => (
              <Text key={item} style={styles.panelText}>
                • {item}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 34,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  displayCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  previousLine: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'right',
  },
  currentLine: {
    color: '#F8FAFC',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'right',
  },
  memoryLine: {
    color: '#22D3EE',
    fontSize: 14,
    textAlign: 'right',
  },
  keypad: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  memoryKey: {
    backgroundColor: '#155E75',
  },
  operatorKey: {
    backgroundColor: '#2563EB',
  },
  equalsKey: {
    backgroundColor: '#7C3AED',
  },
  pressedKey: {
    opacity: 0.75,
  },
  keyText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  panelTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  panelText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
