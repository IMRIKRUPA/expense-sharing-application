import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowRight, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import type { Group, User } from '../App';

interface BalanceSummaryProps {
  group: Group;
  users: User[];
  onSettleBalance: (groupId: string, fromUserId: string, toUserId: string, amount: number) => void;
}

interface Balance {
  userId: string;
  balance: number; // positive means they are owed, negative means they owe
}

interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

export function BalanceSummary({ group, users, onSettleBalance }: BalanceSummaryProps) {
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate balances for each user
  const calculateBalances = (): Balance[] => {
    const balances = new Map<string, number>();

    // Initialize all members with 0 balance
    group.memberIds.forEach(memberId => {
      balances.set(memberId, 0);
    });

    // Process each expense
    group.expenses.forEach(expense => {
      // The person who paid gets credited
      const currentPaidByBalance = balances.get(expense.paidBy) || 0;
      balances.set(expense.paidBy, currentPaidByBalance + expense.amount);

      // Each person in the split gets debited their share
      expense.splits.forEach(split => {
        const currentSplitBalance = balances.get(split.userId) || 0;
        balances.set(split.userId, currentSplitBalance - split.amount);
      });
    });

    return Array.from(balances.entries()).map(([userId, balance]) => ({
      userId,
      balance: Math.round(balance * 100) / 100
    }));
  };

  // Simplify debts to minimize number of transactions
  const simplifyDebts = (balances: Balance[]): SimplifiedDebt[] => {
    const debts: SimplifiedDebt[] = [];
    
    // Separate creditors and debtors
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        debts.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(amount * 100) / 100
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (Math.abs(creditor.balance) < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    return debts;
  };

  const balances = calculateBalances();
  const simplifiedDebts = simplifyDebts([...balances]);

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const handleSettle = () => {
    const amount = parseFloat(settleAmount);
    if (!settleFrom || !settleTo || isNaN(amount) || amount <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    onSettleBalance(group.id, settleFrom, settleTo, amount);
    setSettleFrom('');
    setSettleTo('');
    setSettleAmount('');
    setDialogOpen(false);
  };

  const totalOwed = balances.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0);
  const totalOwing = balances.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-700">Total to Receive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-800">₹{totalOwed.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-700">Total to Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-800">₹{totalOwing.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg border-b border-blue-200">
          <CardTitle className="text-blue-900">Individual Balances</CardTitle>
          <CardDescription>Net balance for each member</CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="space-y-3">
            {balances.map(balance => {
              const user = users.find(u => u.id === balance.userId);
              if (!user) return null;

              return (
                <div
                  key={balance.userId}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div>
                    {Math.abs(balance.balance) < 0.01 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Settled
                      </Badge>
                    ) : balance.balance > 0 ? (
                      <Badge className="bg-green-500 text-white shadow-sm">
                        Gets back ₹{balance.balance.toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white shadow-sm">
                        Owes ₹{Math.abs(balance.balance).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orange-900">Simplified Settlements</CardTitle>
              <CardDescription>Who should pay whom</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white hover:bg-orange-50 border-orange-300">
                  <Check className="w-4 h-4 mr-2" />
                  Settle Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record a Settlement</DialogTitle>
                  <DialogDescription>
                    Mark a payment as settled between members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="settleFrom">From</Label>
                    <Select value={settleFrom} onValueChange={setSettleFrom}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select person paying" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => group.memberIds.includes(u.id)).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="settleTo">To</Label>
                    <Select value={settleTo} onValueChange={setSettleTo}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select person receiving" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => group.memberIds.includes(u.id)).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="settleAmount">Amount (₹)</Label>
                    <Input
                      id="settleAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleSettle} className="w-full bg-green-600 hover:bg-green-700">
                    Settle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          {simplifiedDebts.length === 0 ? (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">All settled! No pending payments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {simplifiedDebts.map((debt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-300 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-semibold text-orange-900">{getUserName(debt.from)}</span>
                    <ArrowRight className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-orange-900">{getUserName(debt.to)}</span>
                  </div>
                  <Badge className="bg-orange-500 text-white shadow-sm text-base px-3 py-1">
                    ₹{debt.amount.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}