import React, { useState, useEffect,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  User, 
  LogOut, 
  Menu,
  X,
  Home,
  Plus,
  Moon,
  Calendar,
  Tag,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';

function Dashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newIncome, setNewIncome] = useState({
    title: '',
    amount: '',
    category: 'Salary',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: !showAddExpense && !showAddIncome },
    { name: 'Add Expense', href: '#', icon: Plus, current: showAddExpense },
    { name: 'Add Income', href: '#', icon: TrendingUp, current: showAddIncome },
  ];

  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Healthcare', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];

  const checkUser = useCallback(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) throw profileError;

    setUser({
      id: session.user.id,
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      avatar: profile.avatar_url
    });

    await fetchFinancialData(session.user.id);
  } catch (error) {
    console.error('Error checking user:', error);
    navigate('/login');
  } finally {
    setLoading(false);
  }
}, [navigate]);

useEffect(() => {
    checkUser();
  }, [checkUser]);

  const fetchFinancialData = async (userId) => {
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (incomeError) throw incomeError;
      setIncome(incomeData || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          title: newExpense.title,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description,
          date: newExpense.date
        }]);

      if (error) throw error;

      await fetchFinancialData(user.id);
      setNewExpense({
        title: '',
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddExpense(false);
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!newIncome.title || !newIncome.amount) return;

    try {
      const { error } = await supabase
        .from('income')
        .insert([{
          user_id: user.id,
          title: newIncome.title,
          amount: parseFloat(newIncome.amount),
          category: newIncome.category,
          description: newIncome.description,
          date: newIncome.date
        }]);

      if (error) throw error;

      await fetchFinancialData(user.id);
      setNewIncome({
        title: '',
        amount: '',
        category: 'Salary',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddIncome(false);
      alert('Income added successfully!');
    } catch (error) {
      console.error('Error adding income:', error);
      alert('Failed to add income');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleExpenseChange = (field, value) => {
    setNewExpense(prev => ({ ...prev, [field]: value }));
  };

  const handleIncomeChange = (field, value) => {
    setNewIncome(prev => ({ ...prev, [field]: value }));
  };

  const calculateFinancialData = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === selectedYear);
    const yearIncome = income.filter(i => new Date(i.date).getFullYear() === selectedYear);

    if (viewMode === 'monthly' && selectedYear === currentYear) {
      const monthExpenses = yearExpenses.filter(e => new Date(e.date).getMonth() === currentMonth);
      const monthIncome = yearIncome.filter(i => new Date(i.date).getMonth() === currentMonth);

      return {
        income: monthIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
      };
    } else {
      return {
        income: yearIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        expenses: yearExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
      };
    }
  };

  const getAvailableYears = () => {
    const years = new Set();
    expenses.forEach(e => years.add(new Date(e.date).getFullYear()));
    income.forEach(i => years.add(new Date(i.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  };

  const getMonthlyTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });

      const monthIncome = income.filter(i => {
        const date = new Date(i.date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });

      return {
        month,
        income: monthIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
      };
    });
  };

  const getYearlyTrendData = () => {
    const years = getAvailableYears();
    
    return years.map(year => {
      const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
      const yearIncome = income.filter(i => new Date(i.date).getFullYear() === year);

      return {
        year: year.toString(),
        income: yearIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        expenses: yearExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
      };
    });
  };

  const getExpenseCategoryData = () => {
    const categoryTotals = {};
    const colors = {
      'Food': '#10b981',
      'Transport': '#3b82f6',
      'Shopping': '#f59e0b',
      'Utilities': '#ef4444',
      'Entertainment': '#8b5cf6',
      'Healthcare': '#ec4899',
      'Other': '#6b7280'
    };

    expenses.forEach(e => {
      const category = e.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(e.amount);
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#6b7280'
    }));
  };

  const getIncomeCategoryData = () => {
    const categoryTotals = {};
    const colors = {
      'Salary': '#10b981',
      'Freelance': '#3b82f6',
      'Business': '#f59e0b',
      'Investment': '#ef4444',
      'Gift': '#8b5cf6',
      'Other': '#6b7280'
    };

    income.forEach(i => {
      const category = i.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(i.amount);
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#6b7280'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentData = calculateFinancialData();
  const currentYear = new Date().getFullYear();
  const isCurrentYear = selectedYear === currentYear;
  const availableYears = getAvailableYears();
  const trendData = viewMode === 'monthly' ? getMonthlyTrendData() : getYearlyTrendData();
  const getTrendXAxisKey = () => viewMode === 'monthly' ? 'month' : 'year';
  const expenseCategoryData = getExpenseCategoryData();
  const incomeCategoryData = getIncomeCategoryData();

  const avgMonthlyIncome = income.length > 0 
    ? income.reduce((sum, i) => sum + parseFloat(i.amount), 0) / Math.max(getMonthlyTrendData().length, 1)
    : 0;
  
  const avgMonthlyExpenses = expenses.length > 0
    ? expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / Math.max(getMonthlyTrendData().length, 1)
    : 0;

  const savingsRate = avgMonthlyIncome > 0 
    ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome * 100).toFixed(1)
    : 0;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                type="button"
                className={`md:hidden p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <a href="#" className="flex items-center space-x-2 ml-4 md:ml-0">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                  Budgetly
                </span>
              </a>

              <nav className="hidden md:flex space-x-1 ml-8">
                {navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.name === 'Add Expense') {
                        setShowAddExpense(true);
                        setShowAddIncome(false);
                      } else if (item.name === 'Add Income') {
                        setShowAddIncome(true);
                        setShowAddExpense(false);
                      } else {
                        setShowAddExpense(false);
                        setShowAddIncome(false);
                      }
                    }}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-emerald-100 text-emerald-700'
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <Moon className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`flex items-center space-x-3 p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.name}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50`}>
                    <div className="py-1">
                      <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                      </div>
                      
                      <a
                        href="#profile"
                        className={`flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Your Profile
                      </a>
                      
                      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                      
                      <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.name === 'Add Expense') {
                      setShowAddExpense(true);
                      setShowAddIncome(false);
                    } else if (item.name === 'Add Income') {
                      setShowAddIncome(true);
                      setShowAddExpense(false);
                    } else {
                      setShowAddExpense(false);
                      setShowAddIncome(false);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.current
                      ? 'bg-emerald-100 text-emerald-700'
                      : isDarkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAddIncome ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Add New Income</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Record your income sources</p>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-8 border`}>
              <form onSubmit={handleIncomeSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Income Title
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Monthly Salary"
                      value={newIncome.title}
                      onChange={(e) => handleIncomeChange('title', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newIncome.amount}
                      onChange={(e) => handleIncomeChange('amount', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={newIncome.category}
                      onChange={(e) => handleIncomeChange('category', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {incomeCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={newIncome.date}
                      onChange={(e) => handleIncomeChange('date', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Description (Optional)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      placeholder="Additional details about this income..."
                      value={newIncome.description}
                      onChange={(e) => handleIncomeChange('description', e.target.value)}
                      rows={3}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddIncome(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Add Income
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : showAddExpense ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Add New Expense</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track your spending by adding a new expense</p>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-8 border`}>
              <form onSubmit={handleExpenseSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Expense Title
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Lunch at Restaurant"
                      value={newExpense.title}
                      onChange={(e) => handleExpenseChange('title', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => handleExpenseChange('amount', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={newExpense.category}
                      onChange={(e) => handleExpenseChange('category', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {expenseCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => handleExpenseChange('date', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Description (Optional)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      placeholder="Additional details about this expense..."
                      value={newExpense.description}
                      onChange={(e) => handleExpenseChange('description', e.target.value)}
                      rows={3}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Welcome back, {user.name.split(' ')[0]}!
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Here's what's happening with your finances today.
              </p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className={`inline-flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                <button
                  onClick={() => setViewMode('monthly')}
                  disabled={!isCurrentYear}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'monthly'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : !isCurrentYear
                        ? isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                        : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly View
                </button>
                <button
                  onClick={() => setViewMode('total')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'total'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Total View
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setSelectedYear(newYear);
                    if (newYear !== currentYear && viewMode === 'monthly') {
                      setViewMode('total');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                {!isCurrentYear && viewMode === 'monthly'
                  ? `Monthly view is only available for ${currentYear}. Showing total view for ${selectedYear}.`
                  : viewMode === 'monthly' 
                    ? `Showing data for the current month of ${selectedYear}`
                    : `Showing total accumulated data for the entire year ${selectedYear}`
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {viewMode === 'monthly' ? 'This Month Income' : `Total Income ${selectedYear}`}
                    </p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      ${currentData.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {viewMode === 'monthly' ? 'This Month Expenses' : `Total Expenses ${selectedYear}`}
                    </p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      ${currentData.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Net Balance ({viewMode === 'monthly' ? 'This Month' : selectedYear})
                    </p>
                    <p className={`text-3xl font-bold ${
                      currentData.income - currentData.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(currentData.income - currentData.expenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-base ml-2">
                        {currentData.income - currentData.expenses >= 0 ? '(Surplus)' : '(Deficit)'}
                      </span>
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    currentData.income - currentData.expenses >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <DollarSign className={`w-6 h-6 ${
                      currentData.income - currentData.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-6 h-6 ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`} />
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Financial Analytics
                </h2>
              </div>

              {trendData.length > 0 ? (
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>
                    {viewMode === 'monthly' ? 'Income vs Expenses Trend (Monthly)' : 'Income vs Expenses Trend (Yearly)'}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey={getTrendXAxisKey()}
                        stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f3f4f6' : '#111827'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                  <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No data available yet. Start by adding your first income or expense!
                  </p>
                </div>
              )}

              {(expenseCategoryData.length > 0 || incomeCategoryData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {expenseCategoryData.length > 0 && (
                    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>
                        Expense Categories
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expenseCategoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expenseCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                              borderRadius: '8px',
                              color: isDarkMode ? '#f3f4f6' : '#111827'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {incomeCategoryData.length > 0 && (
                    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>
                        Income Sources
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeCategoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                          <XAxis 
                            dataKey="name" 
                            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                              borderRadius: '8px',
                              color: isDarkMode ? '#f3f4f6' : '#111827'
                            }}
                          />
                          <Bar dataKey="value" name="Amount">
                            {incomeCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-4 border`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Monthly Income</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        ${avgMonthlyIncome.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-4 border`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Monthly Expenses</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        ${avgMonthlyExpenses.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-4 border`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Savings Rate</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {savingsRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;