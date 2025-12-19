import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Receipt, Calendar } from 'lucide-react';
import type { Group, User } from '../App';

interface ExpenseHistoryProps {
  group: Group;
  users: User[];
}

export function ExpenseHistory({ group, users }: ExpenseHistoryProps) {
  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSplitTypeLabel = (splitType: string) => {
    switch (splitType) {
      case 'equal':
        return 'Equal';
      case 'exact':
        return 'Exact';
      case 'percentage':
        return 'Percentage';
      default:
        return splitType;
    }
  };

  const sortedExpenses = [...group.expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg border-b border-violet-200">
        <CardTitle className="flex items-center gap-2 text-violet-900">
          <Receipt className="w-5 h-5" />
          Expense History ({group.expenses.length})
        </CardTitle>
        <CardDescription>All expenses for this group</CardDescription>
      </CardHeader>
      <CardContent className="mt-4">
        {sortedExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No expenses yet. Add your first expense!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 border-2 border-violet-200 rounded-lg hover:bg-violet-50/50 transition-all bg-white shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-violet-900 mb-1">{expense.description}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-violet-900">₹{expense.amount.toFixed(2)}</p>
                    <Badge variant="outline" className="mt-1 bg-violet-50 border-violet-300 text-violet-700">
                      {getSplitTypeLabel(expense.splitType)}
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-violet-100">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Paid by:</span>{' '}
                    <span className="text-gray-900 font-semibold">{getUserName(expense.paidBy)}</span>
                  </p>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Split details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {expense.splits.map((split) => (
                        <div
                          key={split.userId}
                          className="flex items-center justify-between text-sm bg-gradient-to-r from-violet-50 to-purple-50 px-3 py-2 rounded border border-violet-200"
                        >
                          <span className="font-medium">{getUserName(split.userId)}</span>
                          <span className="font-semibold text-violet-900">₹{split.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}