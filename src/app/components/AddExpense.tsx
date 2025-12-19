import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus } from 'lucide-react';
import type { Group, User, Expense } from '../App';

interface AddExpenseProps {
  group: Group;
  users: User[];
  onAddExpense: (groupId: string, expense: Omit<Expense, 'id' | 'date'>) => void;
  onSuccess: () => void;
}

export function AddExpense({ group, users, onAddExpense, onSuccess }: AddExpenseProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [splits, setSplits] = useState<{ userId: string; value: string }[]>([]);

  const groupMembers = users.filter(u => group.memberIds.includes(u.id));

  // Initialize splits when split type or members change
  useEffect(() => {
    setSplits(groupMembers.map(m => ({ userId: m.id, value: '' })));
  }, [splitType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!paidBy) {
      alert('Please select who paid');
      return;
    }

    let calculatedSplits: { userId: string; amount: number }[] = [];

    if (splitType === 'equal') {
      const splitAmount = totalAmount / groupMembers.length;
      calculatedSplits = groupMembers.map(m => ({
        userId: m.id,
        amount: Math.round(splitAmount * 100) / 100
      }));
    } else if (splitType === 'exact') {
      calculatedSplits = splits.map(s => ({
        userId: s.userId,
        amount: parseFloat(s.value) || 0
      }));

      const totalSplit = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        alert(`Total split (₹${totalSplit.toFixed(2)}) must equal expense amount (₹${totalAmount.toFixed(2)})`);
        return;
      }
    } else if (splitType === 'percentage') {
      const totalPercentage = splits.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`Total percentage (${totalPercentage.toFixed(2)}%) must equal 100%`);
        return;
      }

      calculatedSplits = splits.map(s => ({
        userId: s.userId,
        amount: Math.round((totalAmount * (parseFloat(s.value) || 0) / 100) * 100) / 100
      }));
    }

    const expense: Omit<Expense, 'id' | 'date'> = {
      description: description.trim(),
      amount: totalAmount,
      paidBy,
      splitType,
      splits: calculatedSplits
    };

    onAddExpense(group.id, expense);
    
    // Reset form
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSplitType('equal');
    setSplits([]);
    
    onSuccess();
  };

  const updateSplit = (userId: string, value: string) => {
    setSplits(splits.map(s => 
      s.userId === userId ? { ...s, value } : s
    ));
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b border-orange-200">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Plus className="w-5 h-5" />
          Add New Expense
        </CardTitle>
        <CardDescription>Record a shared expense for this group</CardDescription>
      </CardHeader>
      <CardContent className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner, Gas, Hotel"
              required
              className="mt-2 bg-white"
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="mt-2 bg-white"
            />
          </div>

          <div>
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="mt-2 bg-white">
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {groupMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Split Type</Label>
            <RadioGroup
              value={splitType}
              onValueChange={(value) => setSplitType(value as 'equal' | 'exact' | 'percentage')}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal" className="cursor-pointer">
                  Equal Split - Split equally among all members
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <RadioGroupItem value="exact" id="exact" />
                <Label htmlFor="exact" className="cursor-pointer">
                  Exact Amount - Specify exact amounts for each member
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">
                  Percentage - Split by percentage
                </Label>
              </div>
            </RadioGroup>
          </div>

          {splitType !== 'equal' && (
            <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
              <Label>
                {splitType === 'exact' ? 'Enter amounts for each member' : 'Enter percentages for each member'}
              </Label>
              {groupMembers.map((member) => {
                const split = splits.find(s => s.userId === member.id);
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-32">
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <Input
                      type="number"
                      step={splitType === 'percentage' ? '0.01' : '0.01'}
                      min="0"
                      value={split?.value || ''}
                      onChange={(e) => updateSplit(member.id, e.target.value)}
                      placeholder={splitType === 'exact' ? '₹0.00' : '0%'}
                      className="flex-1 bg-white"
                    />
                    {splitType === 'percentage' && <span className="text-sm text-gray-500">%</span>}
                  </div>
                );
              })}
              {splitType === 'exact' && amount && (
                <p className="text-sm text-gray-600 mt-2">
                  Total: ₹{splits.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0).toFixed(2)} / ₹{parseFloat(amount).toFixed(2)}
                </p>
              )}
              {splitType === 'percentage' && (
                <p className="text-sm text-gray-600 mt-2">
                  Total: {splits.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0).toFixed(2)}%
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}