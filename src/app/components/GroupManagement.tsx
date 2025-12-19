import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { FolderPlus, Trash2, ChevronRight, Users } from 'lucide-react';
import type { Group, User } from '../App';

interface GroupManagementProps {
  groups: Group[];
  users: User[];
  onAddGroup: (name: string, description: string, memberIds: string[]) => void;
  onDeleteGroup: (id: string) => void;
  onSelectGroup: (id: string) => void;
}

export function GroupManagement({
  groups,
  users,
  onAddGroup,
  onDeleteGroup,
  onSelectGroup
}: GroupManagementProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim() && selectedMembers.length >= 2) {
      onAddGroup(groupName.trim(), groupDescription.trim(), selectedMembers);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <FolderPlus className="w-5 h-5" />
            Create New Group
          </CardTitle>
          <CardDescription>Create a group to track shared expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Trip to Goa, Hostel, Friends"
                className="mt-2 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Input
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What is this group for?"
                className="mt-2 bg-white"
              />
            </div>
            <div>
              <Label>Select Members (minimum 2)</Label>
              {users.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">Please add users first in the Users tab</p>
              ) : (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-white">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`member-${user.id}`}
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <Label
                        htmlFor={`member-${user.id}`}
                        className="cursor-pointer"
                      >
                        {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={!groupName.trim() || selectedMembers.length < 2}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Group
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Groups ({groups.length})
          </CardTitle>
          <CardDescription>View and manage your expense groups</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No groups yet. Create your first group above.</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-purple-900">{group.name}</h3>
                      <span className="text-sm text-gray-500">
                        ({group.memberIds.length} members)
                      </span>
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600">{group.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectGroup(group.id)}
                      className="bg-white hover:bg-purple-100"
                    >
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteGroup(group.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}