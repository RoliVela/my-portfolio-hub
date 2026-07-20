'use client';

import { useCallback, useEffect, useState } from 'react';

interface CalculatorInteractionProps {
  onComplete?: () => void;
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
  className?: string;
  label?: string;
  wide?: boolean;
}

function CalcButton({ children, onClick, className = '', label, wide = false }: CalcButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded font-vt323 text-2xl transition active:scale-95 ${
        wide ? 'col-span-2' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function CalculatorInteraction({ onComplete }: CalculatorInteractionProps) {
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
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border-4 border-white bg-black p-6 shadow-[0_0_0_4px_#000]">
      <div className="mb-2 w-full rounded bg-gray-800 p-4 text-right font-vt323 text-4xl text-white shadow-inner">
        {display}
      </div>

      <div className="grid w-full grid-cols-4 gap-3">
        <CalcButton onClick={clear} className="bg-red-600 text-white hover:bg-red-500" label="Clear">
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
        <CalcButton onClick={() => handleOperator('/')} className="bg-yellow-600 text-white hover:bg-yellow-500" label="Divide">
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
        <CalcButton onClick={() => handleOperator('*')} className="bg-yellow-600 text-white hover:bg-yellow-500" label="Multiply">
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
        <CalcButton onClick={() => handleOperator('-')} className="bg-yellow-600 text-white hover:bg-yellow-500" label="Subtract">
          −
        </CalcButton>

        <CalcButton onClick={() => handleNumber('0')} wide label="0">
          0
        </CalcButton>
        <CalcButton onClick={handleDecimal} label="Decimal">
          .
        </CalcButton>
        <CalcButton onClick={() => handleOperator('+')} className="bg-yellow-600 text-white hover:bg-yellow-500" label="Add">
          +
        </CalcButton>
        <CalcButton onClick={handleEquals} className="bg-green-600 text-white hover:bg-green-500" label="Equals">
          =
        </CalcButton>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="mt-2 w-full rounded border-2 border-white/50 bg-black py-2 font-vt323 text-xl text-white transition hover:border-white hover:bg-white/10"
      >
        Exit
      </button>
    </div>
  );
}
