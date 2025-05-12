import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Palette, Clock, Briefcase, Info } from 'lucide-react';
import apiClient from "../apiClient"; // Assuming an apiClient is set up for API calls

const initialShiftTemplateFormState = {
  name: "",
  startTime: "09:00",
  endTime: "17:00",
  paidBreakDurationMinutes: 0,
  unpaidBreakDurationMinutes: 30,
  department: "",
  notes: "",
  colorCode: "#3b82f6", // Default blue
  isActive: true,
};

function ShiftTemplatesPage() {
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState(initialShiftTemplateFormState);

  const fetchShiftTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all templates, including inactive ones for admin view
      const response = await apiClient.get("/shifttypes/all"); 
      setShiftTemplates(response.data);
    } catch (err) {
      console.error("Error fetching shift templates:", err);
      setError(err.message || "Failed to fetch shift templates.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchShiftTemplates();
  }, [fetchShiftTemplates]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentTemplate && currentTemplate._id) {
        // Update existing template
        await apiClient.put(`/shifttypes/${currentTemplate._id}`, formData);
      } else {
        // Create new template
        await apiClient.post("/shifttypes", formData);
      }
      setIsFormOpen(false);
      setCurrentTemplate(null);
      setFormData(initialShiftTemplateFormState);
      fetchShiftTemplates(); // Refresh the list
    } catch (err) {
      console.error("Error saving shift template:", err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || "Failed to save shift template.");
    }
    setLoading(false);
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      paidBreakDurationMinutes: template.paidBreakDurationMinutes || 0,
      unpaidBreakDurationMinutes: template.unpaidBreakDurationMinutes || 0,
      department: template.department || "",
      notes: template.notes || "",
      colorCode: template.colorCode || "#3b82f6",
      isActive: template.isActive !== undefined ? template.isActive : true,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setCurrentTemplate(null);
    setFormData(initialShiftTemplateFormState);
    setIsFormOpen(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm("Are you sure you want to deactivate this shift template?")) {
      setLoading(true);
      try {
        await apiClient.delete(`/shifttypes/${templateId}`);
        fetchShiftTemplates(); // Refresh the list
      } catch (err) {
        console.error("Error deactivating shift template:", err);
        setError(err.message || "Failed to deactivate shift template.");
      }
      setLoading(false);
    }
  };
  
  const calculateDurationDisplay = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return "N/A";
    const start = new Date(`1970-01-01T${startTimeStr}:00`);
    const end = new Date(`1970-01-01T${endTimeStr}:00`);
    let diff = end.getTime() - start.getTime();
    if (diff < 0) { // Overnight shift
        diff += 24 * 60 * 60 * 1000;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Briefcase className="mr-3 h-8 w-8" /> Shift Templates Management
          </h1>
          <p className="text-muted-foreground">
            Create, view, and manage reusable shift templates for scheduling.
          </p>
        </div>
        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Template</Button>
      </div>

      {error && <p className="text-red-500">Error: {error}</p>}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{currentTemplate ? "Edit Shift Template" : "Create New Shift Template"}</DialogTitle>
            <DialogDescription>
              {currentTemplate ? "Modify the details of the existing shift template." : "Define a new reusable shift template."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time (HH:MM)</Label>
                <Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="endTime">End Time (HH:MM)</Label>
                <Input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paidBreakDurationMinutes">Paid Break (minutes)</Label>
                <Input id="paidBreakDurationMinutes" name="paidBreakDurationMinutes" type="number" min="0" value={formData.paidBreakDurationMinutes} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="unpaidBreakDurationMinutes">Unpaid Break (minutes)</Label>
                <Input id="unpaidBreakDurationMinutes" name="unpaidBreakDurationMinutes" type="number" min="0" value={formData.unpaidBreakDurationMinutes} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="department">Department (Optional)</Label>
              <Input id="department" name="department" value={formData.department} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="colorCode">Color Code</Label>
              <div className="flex items-center gap-2">
                <Input id="colorCode" name="colorCode" type="color" value={formData.colorCode} onChange={handleInputChange} className="w-12 h-10 p-1"/>
                <span>{formData.colorCode}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            </div>
             <div className="flex items-center space-x-2">
              <Input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4"/>
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Template"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Existing Shift Templates</CardTitle>
          <CardDescription>List of all defined shift templates.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading templates...</p>}
          {!loading && !error && shiftTemplates.length === 0 && <p>No shift templates found. Click "Add New Template" to create one.</p>}
          {!loading && !error && shiftTemplates.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Breaks (Paid/Unpaid)</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftTemplates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell className="font-medium">
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: template.colorCode || '#ccc', marginRight: '8px', borderRadius: '50%' }}></span>
                        {template.name}
                    </TableCell>
                    <TableCell>{template.startTime} - {template.endTime}</TableCell>
                    <TableCell>{calculateDurationDisplay(template.startTime, template.endTime)}</TableCell>
                    <TableCell>{template.paidBreakDurationMinutes || 0}m / {template.unpaidBreakDurationMinutes || 0}m</TableCell>
                    <TableCell>{template.department || 'N/A'}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)} className="hover:bg-blue-100 dark:hover:bg-blue-800">
                        <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      {template.isActive && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(template._id)} className="hover:bg-red-100 dark:hover:bg-red-800">
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ShiftTemplatesPage;

