import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast"; // Assuming useToast is set up

// Helper hook to get auth token (replace with actual context)
const useAuth = () => {
  return { token: localStorage.getItem("authToken") };
};

function LeaveConfigurationPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLeaveType, setCurrentLeaveType] = useState(null); // For editing
  const [formData, setFormData] = useState({ name: '', description: '' });
  const { toast } = useToast(); // Initialize toast
  const { token } = useAuth();

  const API_URL = 'http://localhost:3001/api/leave-types'; // Adjust if needed

  // Fetch Leave Types
  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        headers: {
          // Add authorization header if your API requires it
          // 'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeaveTypes(data);
    } catch (err) {
      setError(err.message);
      toast({ title: "Error", description: `Failed to fetch leave types: ${err.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [API_URL, toast]); // Removed token dependency for now

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Add/Edit Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentLeaveType ? `${API_URL}/${currentLeaveType._id}` : API_URL;
    const method = currentLeaveType ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
      }

      await fetchLeaveTypes(); // Refresh list
      setIsDialogOpen(false); // Close dialog
      setCurrentLeaveType(null); // Reset edit state
      setFormData({ name: '', description: '' }); // Reset form
      toast({ title: "Success", description: `Leave type ${currentLeaveType ? 'updated' : 'added'} successfully.` });

    } catch (err) {
      console.error("Submit error:", err);
      toast({ title: "Error", description: `Failed to ${currentLeaveType ? 'update' : 'add'} leave type: ${err.message}`, variant: "destructive" });
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave type?")) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
      }

      await fetchLeaveTypes(); // Refresh list
      toast({ title: "Success", description: "Leave type deleted successfully." });

    } catch (err) {
      console.error("Delete error:", err);
      toast({ title: "Error", description: `Failed to delete leave type: ${err.message}`, variant: "destructive" });
    }
  };

  // Open Dialog for Adding
  const handleAddClick = () => {
    setCurrentLeaveType(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  // Open Dialog for Editing
  const handleEditClick = (leaveType) => {
    setCurrentLeaveType(leaveType);
    setFormData({ name: leaveType.name, description: leaveType.description || '' });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Leave Configuration</h2>
        <Button onClick={handleAddClick}>Add New Leave Type</Button>
      </div>

      {loading && <p>Loading leave types...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">No leave types found.</TableCell>
              </TableRow>
            ) : (
              leaveTypes.map((lt) => (
                <TableRow key={lt._id}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell>{lt.description || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(lt)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(lt._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{currentLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}</DialogTitle>
              <DialogDescription>
                {currentLeaveType ? 'Update the details for this leave type.' : 'Enter the details for the new leave type.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{currentLeaveType ? 'Save Changes' : 'Add Leave Type'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LeaveConfigurationPage;

