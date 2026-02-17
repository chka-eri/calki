import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

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
  ['AC', '⌫', '+/-', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['%', '0', '.', '='],
];

const OPERATOR_SET = new Set(['+', '−', '×', '÷']);

export default function HomeScreen() {
  const [state, setState] = useState<CalcState>(clearAll);

  const onPressKey = useCallback((label: string) => {
    setState((current) => {
      if (/^\d$/.test(label)) {
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
        case '⌫':
          return backspace(current);
        case '=':
          return equals(current);
        case '+/-':
          return toggleSign(current);
        case '%':
          return percent(current);
        default:
          return current;
      }
    });
  }, []);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Calki</Text>

        <View style={styles.displayCard} accessibilityLabel="Calculator display" accessible>
          <Text style={styles.previousLine} numberOfLines={1}>
            {state.prev || ' '}
          </Text>
          <Text style={styles.currentLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
            {state.display}
          </Text>
        </View>

        <View style={styles.keypad}>
          {BUTTON_ROWS.map((row) => (
            <View style={styles.row} key={row.join('-')}>
              {row.map((label) => {
                const isOperator = OPERATOR_SET.has(label);
                const isEquals = label === '=';

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
                      pressed && styles.pressedKey,
                    ]}>
                    <Text style={styles.keyText}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
  },
  displayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    minHeight: 130,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  previousLine: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'right',
  },
  currentLine: {
    color: '#F8FAFC',
    fontSize: 52,
    fontWeight: '700',
    textAlign: 'right',
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorKey: {
    backgroundColor: '#FB923C',
  },
  equalsKey: {
    backgroundColor: '#F97316',
  },
  keyText: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '600',
  },
  pressedKey: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
