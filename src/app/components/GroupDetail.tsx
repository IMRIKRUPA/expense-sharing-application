import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Receipt, DollarSign, History } from 'lucide-react';
import { AddExpense } from './AddExpense';
import { BalanceSummary } from './BalanceSummary';
import { ExpenseHistory } from './ExpenseHistory';
import type { Group, User, Expense } from '../App';

interface GroupDetailProps {
  group: Group;
  users: User[];
  onBack: () => void;
  onAddExpense: (groupId: string, expense: Omit<Expense, 'id' | 'date'>) => void;
  onSettleBalance: (groupId: string, fromUserId: string, toUserId: string, amount: number) => void;
}

export function GroupDetail({
  group,
  users,
  onBack,
  onAddExpense,
  onSettleBalance
}: GroupDetailProps) {
  const [activeTab, setActiveTab] = useState('balances');

  const groupMembers = users.filter(u => group.memberIds.includes(u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
        <Button variant="ghost" onClick={onBack} className="gap-2 hover:bg-indigo-50">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600">{group.description}</p>
          )}
        </div>
      </div>

      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900">Group Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-sm border border-indigo-200"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm shadow-md">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-md">
          <TabsTrigger value="balances" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Add Expense
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-6">
          <BalanceSummary
            group={group}
            users={users}
            onSettleBalance={onSettleBalance}
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <AddExpense
            group={group}
            users={users}
            onAddExpense={onAddExpense}
            onSuccess={() => setActiveTab('balances')}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ExpenseHistory
            group={group}
            users={users}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}