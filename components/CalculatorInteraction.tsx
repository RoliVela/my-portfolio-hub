'use client';

import { useCallback, useEffect, useState } from 'react';

interface CalculatorInteractionProps {
  onComplete?: () => void;
  onUnlock?: () => void;
}

type Operator = '+' | '-' | '*' | '/' | null;

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const stringValue = value.toString();
  if (stringValue.length > 12) {
    return value.toExponential(6);
  }
  return stringValue;
}

interface CalcButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'accent' | 'danger';
  label?: string;
  wide?: boolean;
  className?: string;
}

function CalcButton({
  children,
  onClick,
  variant = 'default',
  label,
  wide = false,
  className = '',
}: CalcButtonProps) {
  const variantClasses = {
    default:
      'bg-pink-200 text-pink-900 border-b-4 border-pink-400 hover:bg-pink-100 active:border-b-0 active:translate-y-1',
    accent:
      'bg-fuchsia-600 text-white border-b-4 border-fuchsia-800 hover:bg-fuchsia-500 active:border-b-0 active:translate-y-1',
    danger:
      'bg-rose-500 text-white border-b-4 border-rose-700 hover:bg-rose-400 active:border-b-0 active:translate-y-1',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded font-vt323 text-xl leading-none transition ${
        wide ? 'col-span-2' : ''
      } ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// Placeholder — change to whatever secret code should unlock the computer.
const FREE_BYPASS_CODE = '6767';

// Keep onComplete prop available for callers; it's passed by the shared wrapper.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CalculatorInteraction({ onComplete, onUnlock }: CalculatorInteractionProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const calculate = useCallback((left: number, right: number, op: Operator): number => {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return right === 0 ? NaN : left / right;
      default:
        return right;
    }
  }, []);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setShouldResetDisplay(false);
  }, []);

  const handleNumber = useCallback(
    (num: string) => {
      setDisplay((prev) => {
        if (shouldResetDisplay) {
          setShouldResetDisplay(false);
          return num;
        }
        if (prev === '0' || prev === 'Error') {
          return num;
        }
        if (prev.replace('.', '').length >= 12) {
          return prev;
        }
        return prev + num;
      });
    },
    [shouldResetDisplay]
  );

  const handleDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (shouldResetDisplay) {
        setShouldResetDisplay(false);
        return '0.';
      }
      if (prev.includes('.') || prev === 'Error') {
        return prev;
      }
      return `${prev}.`;
    });
  }, [shouldResetDisplay]);

  const handleOperator = useCallback(
    (nextOperator: Operator) => {
      const currentValue = parseFloat(display);
      if (Number.isNaN(currentValue)) return;

      if (previousValue === null || operator === null || shouldResetDisplay) {
        setPreviousValue(currentValue);
        setShouldResetDisplay(true);
      } else {
        const result = calculate(previousValue, currentValue, operator);
        if (Number.isNaN(result)) {
          setDisplay('Error');
          setPreviousValue(null);
          setOperator(null);
          setShouldResetDisplay(true);
          return;
        }
        const formatted = formatResult(result);
        setDisplay(formatted);
        setPreviousValue(result);
        setShouldResetDisplay(true);
      }
      setOperator(nextOperator);
    },
    [display, previousValue, operator, shouldResetDisplay, calculate]
  );

  const handleEquals = useCallback(() => {
    if (operator === null || previousValue === null) return;

    const currentValue = parseFloat(display);
    if (Number.isNaN(currentValue)) return;

    const result = calculate(previousValue, currentValue, operator);
    if (Number.isNaN(result)) {
      setDisplay('Error');
      setPreviousValue(null);
      setOperator(null);
      setShouldResetDisplay(true);
      return;
    }

    setDisplay(formatResult(result));
    setPreviousValue(null);
    setOperator(null);
    setShouldResetDisplay(true);
  }, [display, operator, previousValue, calculate]);

  useEffect(() => {
    if (display === FREE_BYPASS_CODE) {
      onUnlock?.();
    }
  }, [display, onUnlock]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumber(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        e.preventDefault();
        handleOperator(e.key as Operator);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        clear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleDecimal, handleOperator, handleEquals, clear]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-xl border-4 border-fuchsia-900 bg-fuchsia-950 p-6 shadow-[0_0_0_4px_#000]">
      <div className="mb-2 w-full rounded border-4 border-fuchsia-700 bg-pink-100 p-4 text-right font-vt323 text-4xl text-fuchsia-950 shadow-inner">
        {display}
      </div>

      <div className="grid w-full grid-cols-4 gap-3">
        <CalcButton onClick={clear} variant="danger" label="Clear">
          C
        </CalcButton>
        <div className="col-span-3" />

        <CalcButton onClick={() => handleNumber('7')} label="7">
          7
        </CalcButton>
        <CalcButton onClick={() => handleNumber('8')} label="8">
          8
        </CalcButton>
        <CalcButton onClick={() => handleNumber('9')} label="9">
          9
        </CalcButton>
        <CalcButton onClick={() => handleOperator('/')} variant="accent" label="Divide">
          ÷
        </CalcButton>

        <CalcButton onClick={() => handleNumber('4')} label="4">
          4
        </CalcButton>
        <CalcButton onClick={() => handleNumber('5')} label="5">
          5
        </CalcButton>
        <CalcButton onClick={() => handleNumber('6')} label="6">
          6
        </CalcButton>
        <CalcButton onClick={() => handleOperator('*')} variant="accent" label="Multiply">
          ×
        </CalcButton>

        <CalcButton onClick={() => handleNumber('1')} label="1">
          1
        </CalcButton>
        <CalcButton onClick={() => handleNumber('2')} label="2">
          2
        </CalcButton>
        <CalcButton onClick={() => handleNumber('3')} label="3">
          3
        </CalcButton>
        <CalcButton onClick={() => handleOperator('-')} variant="accent" label="Subtract">
          −
        </CalcButton>

        <CalcButton onClick={() => handleNumber('0')} wide label="0">
          0
        </CalcButton>
        <CalcButton onClick={handleDecimal} label="Decimal">
          .
        </CalcButton>
        <CalcButton onClick={() => handleOperator('+')} variant="accent" label="Add">
          +
        </CalcButton>
        <CalcButton onClick={handleEquals} variant="accent" label="Equals">
          =
        </CalcButton>
      </div>

    </div>
  );
}
