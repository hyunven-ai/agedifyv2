"use client";
import { useCurrency } from '../context/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const CurrencySelector = ({ className = '' }) => {
  const { currencies, selectedCurrency, changeCurrency } = useCurrency();

  if (!currencies.length) return null;

  return (
    <Select value={selectedCurrency} onValueChange={changeCurrency}>
      <SelectTrigger className={`w-24 h-9 ${className}`} data-testid="currency-selector">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{currency.symbol}</span>
              <span className="text-muted-foreground">{currency.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
