import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Users, FolderOpen, Receipt } from 'lucide-react';
import { UserManagement } from './components/UserManagement';
import { GroupManagement } from './components/GroupManagement';
import { GroupDetail } from './components/GroupDetail';

export interface User {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  expenses: Expense[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: 'equal' | 'exact' | 'percentage';
  splits: { userId: string; amount: number }[];
  date: string;
}

const STORAGE_KEYS = {
  USERS: 'splitwise_users',
  GROUPS: 'splitwise_groups',
  INITIALIZED: 'splitwise_initialized'
};

// Sample data for first load
const SAMPLE_USERS: User[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'Diana' }
];

const SAMPLE_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Weekend Trip',
    description: 'Goa beach trip expenses',
    memberIds: ['1', '2', '3'],
    expenses: [
      {
        id: '1',
        description: 'Hotel booking',
        amount: 6000,
        paidBy: '1',
        splitType: 'equal',
        splits: [
          { userId: '1', amount: 2000 },
          { userId: '2', amount: 2000 },
          { userId: '3', amount: 2000 }
        ],
        date: new Date().toISOString()
      },
      {
        id: '2',
        description: 'Dinner',
        amount: 1500,
        paidBy: '2',
        splitType: 'equal',
        splits: [
          { userId: '1', amount: 500 },
          { userId: '2', amount: 500 },
          { userId: '3', amount: 500 }
        ],
        date: new Date().toISOString()
      }
    ]
  }
];

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Initialize data from localStorage or load sample data
  useEffect(() => {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    
    if (!initialized) {
      // First load - set sample data
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SAMPLE_USERS));
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(SAMPLE_GROUPS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      setUsers(SAMPLE_USERS);
      setGroups(SAMPLE_GROUPS);
    } else {
      // Load from localStorage
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);
      
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedGroups) setGroups(JSON.parse(storedGroups));
    }
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }, [users]);

  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    }
  }, [groups]);

  const addUser = (name: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name
    };
    setUsers([...users, newUser]);
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    // Remove user from all groups
    setGroups(groups.map(g => ({
      ...g,
      memberIds: g.memberIds.filter(mid => mid !== id)
    })));
  };

  const addGroup = (name: string, description: string, memberIds: string[]) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      description,
      memberIds,
      expenses: []
    };
    setGroups([...groups, newGroup]);
  };

  const deleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
  };

  const addExpense = (groupId: string, expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };

    setGroups(groups.map(g => 
      g.id === groupId 
        ? { ...g, expenses: [...g.expenses, newExpense] }
        : g
    ));
  };

  const settleBalance = (groupId: string, fromUserId: string, toUserId: string, amount: number) => {
    // Create a settlement expense
    const settlementExpense: Expense = {
      id: Date.now().toString(),
      description: `Settlement: ${users.find(u => u.id === fromUserId)?.name} paid ${users.find(u => u.id === toUserId)?.name}`,
      amount: amount,
      paidBy: fromUserId,
      splitType: 'exact',
      splits: [
        { userId: fromUserId, amount: 0 },
        { userId: toUserId, amount: amount }
      ],
      date: new Date().toISOString()
    };

    setGroups(groups.map(g => 
      g.id === groupId 
        ? { ...g, expenses: [...g.expenses, settlementExpense] }
        : g
    ));
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <h1 className="text-gray-900 mb-2">Expense Sharing App</h1>
          <p className="text-gray-600">Split expenses fairly with friends and family</p>
        </div>

        {!selectedGroup ? (
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups">
              <GroupManagement
                groups={groups}
                users={users}
                onAddGroup={addGroup}
                onDeleteGroup={deleteGroup}
                onSelectGroup={setSelectedGroupId}
              />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement
                users={users}
                onAddUser={addUser}
                onDeleteUser={deleteUser}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <GroupDetail
            group={selectedGroup}
            users={users}
            onBack={() => setSelectedGroupId(null)}
            onAddExpense={addExpense}
            onSettleBalance={settleBalance}
          />
        )}
      </div>
    </div>
  );
}