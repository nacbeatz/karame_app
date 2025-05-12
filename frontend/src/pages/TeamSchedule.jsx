import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isToday, isFuture, addMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { Users, CalendarClock, Filter, PlusCircle, X, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import axios from 'axios';

function TeamSchedule() {
    // State for schedules data
    const [schedules, setSchedules] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataFetched, setDataFetched] = useState(false);

    // State for new schedule form
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        employeeId: '',
        shiftTypeId: '',
        assignmentType: 'single',
        startDate: new Date(),
        endDate: null,
        daysOfWeek: [],
        notes: ''
    });

    // State for filters with default date range (current month)
    const [filters, setFilters] = useState({
        employeeId: '',
        department: '',
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showDateRangeSelector, setShowDateRangeSelector] = useState(!dataFetched);

    // Function to fetch data with the current filters
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Format dates properly for the API
            const formattedStartDate = filters.startDate.toISOString();
            const formattedEndDate = filters.endDate.toISOString();

            console.log('Fetching schedules with date range:', formattedStartDate, 'to', formattedEndDate);

            // Fetch schedules
            const schedulesResponse = await axios.get('/api/schedules', {
                params: {
                    viewStartDate: formattedStartDate,
                    viewEndDate: formattedEndDate,
                    employeeId: filters.employeeId || undefined,
                    department: filters.department || undefined
                },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('Schedules response:', schedulesResponse.data);

            // Fetch employees
            try {
                console.log('Fetching employees...');
                const employeesResponse = await axios.get('/api/users/employees/public');
                console.log('Employees API response:', employeesResponse);
                console.log('Employees data:', employeesResponse.data);
                console.log('Is array?', Array.isArray(employeesResponse.data));
                console.log('Length:', employeesResponse.data?.length);

                setEmployees(employeesResponse.data || []);
            } catch (empErr) {
                console.error('Error fetching employees:', empErr);
                console.error('Error response:', empErr.response);
                setEmployees([]);
            }

            // Fetch shift types
            try {
                const shiftTypesResponse = await axios.get('/api/shifttypes/all');
                console.log('Shift types response:', shiftTypesResponse.data);
                setShiftTypes(shiftTypesResponse.data || []);
            } catch (shiftErr) {
                console.error('Error fetching shift types:', shiftErr);
                setShiftTypes([]);
            }

            // Handle the schedules response
            if (schedulesResponse.data && Array.isArray(schedulesResponse.data.expandedSchedules)) {
                setSchedules(schedulesResponse.data.expandedSchedules);
            } else if (schedulesResponse.data && schedulesResponse.data.scheduleRules) {
                // If the API returns scheduleRules instead
                const transformedSchedules = schedulesResponse.data.scheduleRules.map(rule => ({
                    ...rule,
                    date: rule.startDate // Use startDate as the date field
                }));
                setSchedules(transformedSchedules);
            } else {
                console.warn('Unexpected schedules response format:', schedulesResponse.data);
                setSchedules([]);
            }

            setDataFetched(true);
            setShowDateRangeSelector(false);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again later.');
            setLoading(false);

            // Set empty arrays to prevent mapping errors
            setEmployees([]);
            setShiftTypes([]);
            setSchedules([]);
        }
    };

    // Date range quick select options
    const dateRangeOptions = [
        {
            label: 'This Week', getValue: () => ({
                startDate: startOfMonth(new Date()),
                endDate: endOfMonth(new Date())
            })
        },
        {
            label: 'Next Week', getValue: () => ({
                startDate: addDays(new Date(), 7),
                endDate: addDays(new Date(), 14)
            })
        },
        {
            label: 'This Month', getValue: () => ({
                startDate: startOfMonth(new Date()),
                endDate: endOfMonth(new Date())
            })
        },
        {
            label: 'Next Month', getValue: () => ({
                startDate: startOfMonth(addMonths(new Date(), 1)),
                endDate: endOfMonth(addMonths(new Date(), 1))
            })
        },
        {
            label: 'Next 3 Months', getValue: () => ({
                startDate: new Date(),
                endDate: endOfMonth(addMonths(new Date(), 2))
            })
        }
    ];

    // Initial data fetch when component mounts
    useEffect(() => {
        if (!dataFetched) {
            setShowDateRangeSelector(true);
        }
    }, [dataFetched]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setNewSchedule(prev => ({ ...prev, [field]: value }));
    };

    // Handle day of week selection for weekly schedules
    const handleDayOfWeekToggle = (day) => {
        setNewSchedule(prev => {
            const currentDays = [...prev.daysOfWeek];
            if (currentDays.includes(day)) {
                return { ...prev, daysOfWeek: currentDays.filter(d => d !== day) };
            } else {
                return { ...prev, daysOfWeek: [...currentDays, day] };
            }
        });
    };

    // Handle schedule creation
    const handleCreateSchedule = async () => {
        try {
            // Validate required fields
            if (!newSchedule.employeeId) {
                setError("Please select an employee");
                return;
            }

            if (!newSchedule.shiftTypeId) {
                setError("Please select a shift type");
                return;
            }

            // Format the data correctly for the backend
            const scheduleData = {
                ...newSchedule,
                startDate: newSchedule.startDate.toISOString(),
                endDate: newSchedule.endDate ? newSchedule.endDate.toISOString() : null
            };

            console.log('Creating schedule with data:', scheduleData);

            // Make the API request
            const response = await axios.post('/api/schedules', scheduleData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('Schedule created successfully:', response.data);

            // Show success message
            alert("Schedule created successfully!");

            // Reset form and close dialog
            setNewSchedule({
                employeeId: '',
                shiftTypeId: '',
                assignmentType: 'single',
                startDate: new Date(),
                endDate: null,
                daysOfWeek: [],
                notes: ''
            });
            setIsDialogOpen(false);

            // Refresh the schedules list
            fetchData();
        } catch (err) {
            console.error('Error creating schedule:', err);
            setError(`Failed to create schedule: ${err.response?.data?.msg || err.message}`);
        }
    };

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Apply a predefined date range
    const applyDateRange = (option) => {
        const newDates = option.getValue();
        setFilters(prev => ({
            ...prev,
            startDate: newDates.startDate,
            endDate: newDates.endDate
        }));
    };

    // Group schedules by date
    const groupedSchedules = schedules.reduce((groups, schedule) => {
        // Try to get a date from either schedule.date or schedule.startDate
        const scheduleDate = schedule.date || schedule.startDate;
        if (!scheduleDate) {
            console.warn('Schedule missing date field:', schedule);
            return groups;
        }

        const date = format(new Date(scheduleDate), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(schedule);
        return groups;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedSchedules).sort();

    // Find open shifts (dates with fewer than expected staff)
    const openShifts = sortedDates.filter(date => {
        const shiftsOnDate = groupedSchedules[date];
        // This is a simplified check - you might want to implement more complex logic
        return isFuture(new Date(date)) && shiftsOnDate.length < 3; // Assuming you need at least 3 staff per day
    });

    // Loading spinner component
    const Spinner = () => (
        <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Users className="mr-3 h-8 w-8" /> Team Schedule
                    </h1>
                    <p className="text-muted-foreground">
                        View and manage schedules for your team members.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" /> Filter Schedule
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-4">
                                <h4 className="font-medium">Filter Options</h4>

                                <div className="space-y-2">
                                    <Label htmlFor="filterEmployee">Employee</Label>
                                    <Select
                                        value={filters.employeeId}
                                        onValueChange={(value) => handleFilterChange('employeeId', value)}
                                    >
                                        <SelectTrigger id="filterEmployee">
                                            <SelectValue placeholder="All Employees" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Employees</SelectItem>
                                            {Array.isArray(employees) && employees.map(employee => (
                                                <SelectItem key={employee._id} value={employee._id}>
                                                    {employee.firstName} {employee.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="filterDepartment">Department</Label>
                                    <Select
                                        value={filters.department}
                                        onValueChange={(value) => handleFilterChange('department', value)}
                                    >
                                        <SelectTrigger id="filterDepartment">
                                            <SelectValue placeholder="All Departments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Departments</SelectItem>
                                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                                            <SelectItem value="Emergency">Emergency</SelectItem>
                                            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                            <SelectItem value="Surgery">Surgery</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <div className="flex space-x-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(filters.startDate, 'PP')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={filters.startDate}
                                                    onSelect={(date) => handleFilterChange('startDate', date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(filters.endDate, 'PP')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={filters.endDate}
                                                    onSelect={(date) => handleFilterChange('endDate', date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        fetchData();
                                        setIsFilterOpen(false);
                                    }}
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Assign New Shift
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Assign New Shift</DialogTitle>
                                <DialogDescription>
                                    Create a new shift assignment for a team member.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee">Employee</Label>
                                    <Select
                                        value={newSchedule.employeeId}
                                        onValueChange={(value) => handleInputChange('employeeId', value)}
                                    >
                                        <SelectTrigger id="employee">
                                            <SelectValue placeholder="Select Employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(employees) && employees.length > 0 ? (
                                                employees.map(employee => (
                                                    <SelectItem key={employee._id} value={employee._id}>
                                                        {employee.firstName} {employee.lastName}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-employees-available" disabled>No employees available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shiftType">Shift Type</Label>
                                    <Select
                                        value={newSchedule.shiftTypeId}
                                        onValueChange={(value) => handleInputChange('shiftTypeId', value)}
                                    >
                                        <SelectTrigger id="shiftType">
                                            <SelectValue placeholder="Select Shift Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(shiftTypes) && shiftTypes.length > 0 ? (
                                                shiftTypes.map(shift => (
                                                    <SelectItem key={shift._id} value={shift._id}>
                                                        {shift.name} ({shift.startTime} - {shift.endTime})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-shifts-available" disabled>No shift types available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="assignmentType">Assignment Type</Label>
                                    <Select
                                        value={newSchedule.assignmentType}
                                        onValueChange={(value) => handleInputChange('assignmentType', value)}
                                    >
                                        <SelectTrigger id="assignmentType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single Day</SelectItem>
                                            <SelectItem value="weekly">Weekly Recurring</SelectItem>
                                            <SelectItem value="monthly">Monthly Recurring</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(newSchedule.startDate, 'PP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newSchedule.startDate}
                                                onSelect={(date) => handleInputChange('startDate', date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {newSchedule.assignmentType !== 'single' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date (Optional)</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newSchedule.endDate ? format(newSchedule.endDate, 'PP') : 'No end date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={newSchedule.endDate}
                                                    onSelect={(date) => handleInputChange('endDate', date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}

                                {newSchedule.assignmentType === 'weekly' && (
                                    <div className="space-y-2">
                                        <Label>Days of Week</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                                                <Button
                                                    key={day}
                                                    type="button"
                                                    variant={newSchedule.daysOfWeek.includes(index) ? "default" : "outline"}
                                                    className="px-3 py-1 h-auto"
                                                    onClick={() => handleDayOfWeekToggle(index)}
                                                >
                                                    {day.substring(0, 3)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {newSchedule.assignmentType === 'monthly' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                                        <Select
                                            value={newSchedule.dayOfMonth?.toString() || ''}
                                            onValueChange={(value) => handleInputChange('dayOfMonth', parseInt(value))}
                                        >
                                            <SelectTrigger id="dayOfMonth">
                                                <SelectValue placeholder="Select Day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <SelectItem key={day} value={day.toString()}>
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input
                                        id="notes"
                                        value={newSchedule.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateSchedule}>Create Schedule</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Date Range Selector Card - Shown before initial data fetch */}
            {showDateRangeSelector && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Select Date Range</CardTitle>
                        <CardDescription>
                            Please select a date range to view schedules
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(filters.startDate, 'PP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={filters.startDate}
                                                onSelect={(date) => handleFilterChange('startDate', date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(filters.endDate, 'PP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={filters.endDate}
                                                onSelect={(date) => handleFilterChange('endDate', date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Quick Select</Label>
                                <div className="flex flex-wrap gap-2">
                                    {dateRangeOptions.map((option, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyDateRange(option)}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full" onClick={fetchData}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Load Schedules
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center p-8">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>
            ) : (
                <>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Team Shift Overview</CardTitle>
                                <CardDescription>
                                    {format(filters.startDate, 'MMMM d, yyyy')} - {format(filters.endDate, 'MMMM d, yyyy')}
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowDateRangeSelector(true)}>
                                Change Date Range
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {sortedDates.length === 0 ? (
                                <div className="h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
                                    <CalendarClock className="h-16 w-16 text-muted-foreground" />
                                    <p className="text-muted-foreground ml-2">No schedules found for the selected period.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                                    {sortedDates.map(date => (
                                        <div key={date} className="border rounded-md p-4">
                                            <h3 className={`font-medium text-lg mb-3 ${isToday(new Date(date)) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                                {isToday(new Date(date)) && <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">Today</span>}
                                            </h3>
                                            <div className="space-y-2">
                                                {groupedSchedules[date].map((schedule, idx) => {
                                                    // Safely access employee and shift type data
                                                    const employee = Array.isArray(employees) && employees.find(e =>
                                                        e._id === (schedule.employeeId?._id || schedule.employeeId)
                                                    );
                                                    const shiftType = Array.isArray(shiftTypes) && shiftTypes.find(s =>
                                                        s._id === (schedule.shiftTypeId?._id || schedule.shiftTypeId)
                                                    );

                                                    const employeeName = employee
                                                        ? `${employee.firstName} ${employee.lastName}`
                                                        : schedule.employeeId?.firstName
                                                            ? `${schedule.employeeId.firstName} ${schedule.employeeId.lastName}`
                                                            : 'Unknown Employee';

                                                    const shiftInfo = shiftType
                                                        ? `${shiftType.name} (${shiftType.startTime} - ${shiftType.endTime})`
                                                        : schedule.shiftTypeId?.name
                                                            ? `${schedule.shiftTypeId.name} (${schedule.shiftTypeId.startTime} - ${schedule.shiftTypeId.endTime})`
                                                            : 'Unknown Shift';

                                                    return (
                                                        <div
                                                            key={`${date}-${idx}`}
                                                            className="flex items-center p-3 bg-white dark:bg-gray-800 border rounded-md"
                                                            style={{
                                                                borderLeftColor: (shiftType?.colorCode || schedule.shiftTypeId?.colorCode || '#888'),
                                                                borderLeftWidth: '4px'
                                                            }}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="font-medium">{employeeName}</div>
                                                                <div className="text-sm text-muted-foreground">{shiftInfo}</div>
                                                                {schedule.notes && (
                                                                    <div className="text-sm italic mt-1">{schedule.notes}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                                                                    <span className="sr-only">Edit</span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                                                        <path d="m15 5 4 4"></path>
                                                                    </svg>
                                                                </Button>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" title="Delete">
                                                                    <span className="sr-only">Delete</span>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Open Shifts / Understaffed Periods</CardTitle>
                            <CardDescription>Identify and manage open shifts or understaffed periods.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {openShifts.length === 0 ? (
                                <div className="h-[200px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
                                    <p className="text-muted-foreground">No open shifts identified for the selected period.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {openShifts.map(date => (
                                        <div key={date} className="flex justify-between items-center p-3 border rounded-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                                            <div>
                                                <div className="font-medium">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {groupedSchedules[date].length} staff assigned (recommended: 3+)
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => {
                                                setNewSchedule(prev => ({
                                                    ...prev,
                                                    startDate: new Date(date)
                                                }));
                                                setIsDialogOpen(true);
                                            }}>
                                                Assign Staff
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

export default TeamSchedule;
