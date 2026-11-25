import { useState } from 'react'
import './App.css'
import AdminUserManagement from './AdminUserManagement'

// Generate an account number that is not already assigned to another user.
function generateAccountNumber(users) {
  let accountNumber

  do {
    accountNumber =
      'SB' + Math.floor(1000000000 + Math.random() * 9000000000)
  } while (users.some((user) => user.accountNumber === accountNumber))

  return accountNumber
}

// Add account numbers to older registered users that do not have one yet.
function ensureAccountNumbers(users) {
  const updatedUsers = [...users]

  updatedUsers.forEach((user, index) => {
    if (!user.accountNumber) {
      updatedUsers[index] = {
        ...user,
        accountNumber: generateAccountNumber(updatedUsers),
      }
    }
  })

  return updatedUsers
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = readJSON('currentBankUser', null)
    if (!savedUser) return null

    const users = ensureAccountNumbers(readJSON('bankUsers', []))
    const matchingUser = users.find((user) => user.email === savedUser.email)
    const activeUser = matchingUser || {
      ...savedUser,
      accountNumber:
        savedUser.accountNumber || generateAccountNumber(users),
    }

    const updatedUsers = matchingUser
      ? users
      : [...users, activeUser]

    localStorage.setItem('bankUsers', JSON.stringify(updatedUsers))
    localStorage.setItem('currentBankUser', JSON.stringify(activeUser))
    return activeUser
  })

  const [isLogin, setIsLogin] = useState(true)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const [balance, setBalance] = useState(() => {
    const user = readJSON('currentBankUser', null)
    return user
      ? Number(localStorage.getItem(`balance_${user.email}`) || 10000)
      : 10000
  })

  const [transactions, setTransactions] = useState(() => {
    const user = readJSON('currentBankUser', null)
    return user
      ? readJSON(`transactions_${user.email}`, [])
      : []
  })
  const [transactionFilter, setTransactionFilter] = useState('All')

  const [amount, setAmount] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [recipientAccount, setRecipientAccount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferMessage, setTransferMessage] = useState('')

  const filteredTransactions = transactions.filter((transaction) =>
    transactionFilter === 'All' || transaction.type === transactionFilter
  )

  const loginUser = (user) => {
    const existingUsers = readJSON('bankUsers', [])
    const usersWithNumbers = ensureAccountNumbers(existingUsers)

    let activeUser = usersWithNumbers.find(
      (item) => item.email === user.email
    )

    if (!activeUser) {
      activeUser = {
        ...user,
        accountNumber:
          user.accountNumber || generateAccountNumber(usersWithNumbers),
      }
      usersWithNumbers.push(activeUser)
    } else if (!activeUser.accountNumber) {
      activeUser = {
        ...activeUser,
        accountNumber: generateAccountNumber(usersWithNumbers),
      }
    }

    const updatedUsers = usersWithNumbers.map((item) =>
      item.email === activeUser.email ? activeUser : item
    )

    localStorage.setItem('bankUsers', JSON.stringify(updatedUsers))
    localStorage.setItem('currentBankUser', JSON.stringify(activeUser))

    setCurrentUser(activeUser)

    const savedBalance = Number(
      localStorage.getItem(`balance_${activeUser.email}`) || 10000
    )
    const savedTransactions = readJSON(
      `transactions_${activeUser.email}`,
      []
    )

    setBalance(savedBalance)
    setTransactions(savedTransactions)
    setMessage('')
    setActionMessage('')
    setTransferMessage('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('')

    if (isAdminLogin) {
      if (email.trim().toLowerCase() === 'admin@securebank.com' && password === 'Admin@123') {
        setAdminLoggedIn(true)
        setEmail('')
        setPassword('')
        setMessage('')
      } else {
        setMessage('Invalid admin email or password.')
      }
      return
    }

    const users = readJSON('bankUsers', [])

    if (isLogin) {
      const user = users.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase() &&
          item.password === password
      )

      if (!user) {
        setMessage('Invalid email or password.')
        return
      }

      loginUser(user)
      return
    }

    if (!name.trim() || !email.trim() || !password) {
      setMessage('Please fill in all fields.')
      return
    }

    if (users.some(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase()
    )) {
      setMessage('This email is already registered.')
      return
    }

    const usersWithNumbers = ensureAccountNumbers(users)
    const newUser = {
      name: name.trim(),
      email: email.trim(),
      password,
      accountNumber: generateAccountNumber(usersWithNumbers),
    }

    usersWithNumbers.push(newUser)
    localStorage.setItem('bankUsers', JSON.stringify(usersWithNumbers))
    loginUser(newUser)
  }

  const handleTransaction = (type) => {
    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0) {
      setActionMessage('Please enter a valid amount.')
      return
    }

    if (type === 'Withdraw' && value > balance) {
      setActionMessage('Insufficient balance.')
      return
    }

    const newBalance =
      type === 'Deposit' ? balance + value : balance - value

    const newTransaction = {
      id: Date.now(),
      type,
      amount: value,
      date: new Date().toLocaleString(),
    }

    const updatedTransactions = [newTransaction, ...transactions]

    setBalance(newBalance)
    setTransactions(updatedTransactions)
    setAmount('')
    setActionMessage(`${type} successful!`)

    localStorage.setItem(
      `balance_${currentUser.email}`,
      String(newBalance)
    )
    localStorage.setItem(
      `transactions_${currentUser.email}`,
      JSON.stringify(updatedTransactions)
    )
  }

  const handleTransfer = () => {
    const value = Number(transferAmount)
    const accountNumber = recipientAccount.trim().toUpperCase()

    setTransferMessage('')

    if (!accountNumber || !Number.isFinite(value) || value <= 0) {
      setTransferMessage('Enter a valid account number and amount.')
      return
    }

    const users = ensureAccountNumbers(readJSON('bankUsers', []))
    localStorage.setItem('bankUsers', JSON.stringify(users))

    const receiver = users.find(
      (user) => user.accountNumber === accountNumber
    )

    if (!receiver) {
      setTransferMessage('Receiver account not found.')
      return
    }

    if (receiver.email === currentUser.email) {
      setTransferMessage('You cannot transfer money to your own account.')
      return
    }

    const senderBalance = Number(
      localStorage.getItem(`balance_${currentUser.email}`) || 10000
    )
    const receiverBalance = Number(
      localStorage.getItem(`balance_${receiver.email}`) || 10000
    )

    if (value > senderBalance) {
      setTransferMessage('Insufficient balance.')
      return
    }

    const date = new Date().toLocaleString()
    const transferId = Date.now()

    const senderTransactions = readJSON(
      `transactions_${currentUser.email}`,
      []
    )
    const receiverTransactions = readJSON(
      `transactions_${receiver.email}`,
      []
    )

    const updatedSenderTransactions = [
      {
        id: transferId,
        type: 'Transfer',
        amount: value,
        date,
        details: `To ${receiver.name} (${accountNumber})`,
      },
      ...senderTransactions,
    ]

    const updatedReceiverTransactions = [
      {
        id: transferId + 1,
        type: 'Received',
        amount: value,
        date,
        details: `From ${currentUser.name} (${currentUser.accountNumber})`,
      },
      ...receiverTransactions,
    ]

    localStorage.setItem(
      `balance_${currentUser.email}`,
      String(senderBalance - value)
    )
    localStorage.setItem(
      `balance_${receiver.email}`,
      String(receiverBalance + value)
    )
    localStorage.setItem(
      `transactions_${currentUser.email}`,
      JSON.stringify(updatedSenderTransactions)
    )
    localStorage.setItem(
      `transactions_${receiver.email}`,
      JSON.stringify(updatedReceiverTransactions)
    )

    setBalance(senderBalance - value)
    setTransactions(updatedSenderTransactions)
    setTransferAmount('')
    setRecipientAccount('')
    setTransferMessage('Money transferred successfully!')
  }

  const handleLogout = () => {
    localStorage.removeItem('currentBankUser')
    setCurrentUser(null)
    setEmail('')
    setPassword('')
    setName('')
    setMessage('')
    setActionMessage('')
    setTransferMessage('')
    setIsLogin(true)
  }

  
if (adminLoggedIn) {
  return (
    <div className="bank-app">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">✦</span>
          SecureBank
          <span className="admin-nav-label">ADMIN</span>
        </div>

        <button
          className="logout-btn"
          onClick={() => setAdminLoggedIn(false)}
        >
          Logout ↗
        </button>
      </header>

      <main className="dashboard admin-dashboard">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Admin Dashboard</h1>
            <p>Manage registered SecureBank demo accounts.</p>
          </div>

          <div className="user-avatar admin-avatar">A</div>
        </div>

        <AdminUserManagement />
      </main>
    </div>
  )
}


  if (currentUser) {
    return (
      <div className="bank-app">
        <header className="navbar">
          <div className="brand">
            <span className="brand-icon">✦</span>
            SecureBank
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout ↗
          </button>
        </header>

        <main className="dashboard">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">PERSONAL BANKING</span>
              <h1>Welcome, {currentUser.name}!</h1>
              <p>Here's your account overview.</p>
            </div>
            <div className="user-avatar">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <section className="balance-card">
            <p>AVAILABLE ACCOUNT BALANCE</p>
            <h2>
              ₹ {balance.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
            <span>Account Number: {currentUser.accountNumber}</span>
          </section>

          <section
            className="action-card profile-card"
            style={{
              marginTop: '24px',
              padding: '26px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="eyebrow">MY ACCOUNT</span>
              <h2 style={{ color: '#172b4e', fontSize: '21px', marginTop: '8px' }}>
                My Profile
              </h2>
              <p style={{ color: '#8995a8', fontSize: '12px', marginTop: '6px' }}>
                Your SecureBank account information.
              </p>
            </div>

            <div>
              <p style={{ color: '#8995a8', fontSize: '11px', marginBottom: '6px' }}>
                FULL NAME
              </p>
              <strong style={{ color: '#172b4e', fontSize: '14px' }}>
                {currentUser.name}
              </strong>
            </div>

            <div>
              <p style={{ color: '#8995a8', fontSize: '11px', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </p>
              <strong style={{ color: '#172b4e', fontSize: '14px', overflowWrap: 'anywhere' }}>
                {currentUser.email}
              </strong>
            </div>

            <div>
              <p style={{ color: '#8995a8', fontSize: '11px', marginBottom: '6px' }}>
                ACCOUNT NUMBER
              </p>
              <strong style={{ color: '#2168d3', fontSize: '14px' }}>
                {currentUser.accountNumber}
              </strong>
            </div>

            <div>
              <p style={{ color: '#8995a8', fontSize: '11px', marginBottom: '6px' }}>
                CURRENT BALANCE
              </p>
              <strong style={{ color: '#159b66', fontSize: '14px' }}>
                ₹ {balance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </section>

          <section className="transaction-actions">
            <div className="action-card">
              <h3>Deposit Money</h3>
              <p>Add money to your demo account.</p>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                className="deposit-btn"
                onClick={() => handleTransaction('Deposit')}
              >
                + Deposit Money
              </button>
            </div>

            <div className="action-card">
              <h3>Withdraw Money</h3>
              <p>Withdraw money from your demo account.</p>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                className="withdraw-btn"
                onClick={() => handleTransaction('Withdraw')}
              >
                − Withdraw Money
              </button>
            </div>
          </section>

          {actionMessage && (
            <div className="dashboard-message">{actionMessage}</div>
          )}

          <section className="action-card transfer-card">
            <h3>Transfer Money</h3>
            <p>Send money to another SecureBank user.</p>
            <input
              type="text"
              placeholder="Enter receiver account number"
              value={recipientAccount}
              onChange={(e) => setRecipientAccount(e.target.value)}
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter transfer amount (₹)"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            <button className="transfer-btn" onClick={handleTransfer}>
              ↗ Transfer Money
            </button>
            {transferMessage && (
              <div className="dashboard-message">{transferMessage}</div>
            )}
          </section>

          <section className="history-section">
            <h2>Recent Transactions</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px', marginBottom: '18px' }}>
              {['All', 'Deposit', 'Withdraw', 'Transfer', 'Received'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTransactionFilter(filter)}
                  style={{
                    width: 'auto',
                    margin: 0,
                    padding: '9px 15px',
                    border: transactionFilter === filter ? '1px solid #2168d3' : '1px solid #dfe6f0',
                    borderRadius: '20px',
                    background: transactionFilter === filter ? '#2168d3' : '#f5f7fb',
                    color: transactionFilter === filter ? '#ffffff' : '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {filter === 'All' ? 'All' : filter}
                </button>
              ))}
            </div>
            {transactions.length === 0 ? (
              <p className="empty-history">
                No transactions yet. Make your first deposit!
              </p>
            ) : filteredTransactions.length === 0 ? (
              <p className="empty-history">
                No {transactionFilter.toLowerCase()} transactions found.
              </p>
            ) : (
              <div className="transaction-list">
                {filteredTransactions.map((transaction) => {
                  const isCredit = ['Deposit', 'Received'].includes(
                    transaction.type
                  )

                  return (
                    <div className="transaction-row" key={transaction.id}>
                      <div className="transaction-icon">
                        {isCredit ? '↓' : '↑'}
                      </div>
                      <div className="transaction-info">
                        <strong>{transaction.type}</strong>
                        <span>{transaction.date}</span>
                        {transaction.details && (
                          <span>{transaction.details}</span>
                        )}
                      </div>
                      <strong className={isCredit ? 'deposit-text' : 'withdraw-text'}>
                        {isCredit ? '+' : '-'}₹
                        {Number(transaction.amount).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <p className="demo-notice">
            Educational demo only. No real money is involved.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="bank-app">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">✦</span>
          SecureBank
        </div>
        <span className="nav-tag">PERSONAL BANKING</span>
      </header>

      <main className="main-content">
        <section className="welcome-section">
          <span className="eyebrow">YOUR MONEY. YOUR FUTURE.</span>
          <h1>
            Banking made
            <br />
            <span>simple &amp; secure.</span>
          </h1>
          <p className="welcome-text">
            A smarter way to manage your money. Access your
            banking dashboard, track transactions and take
            control of your finances.
          </p>

          <div className="features">
            <div className="feature"><span>✓</span> Easy account management</div>
            <div className="feature"><span>✓</span> Simple transaction tracking</div>
            <div className="feature"><span>✓</span> Convenient digital banking</div>
          </div>

          <div className="security-note">
            <span>🔒</span>
            <div>
              <strong>Your security matters</strong>
              <p>Demo banking interface for learning purposes.</p>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-heading">
            <span className="card-label">WELCOME TO SECUREBANK</span>
            <h2>{isAdminLogin ? 'Admin sign in' : isLogin ? 'Sign in' : 'Create account'}</h2>
            <p>
              {isAdminLogin ? 'Authorized administrators only.' : isLogin ? 'Enter your details to access your account.' : 'Join us and start your digital banking journey.'}
            </p>
          </div>

          <div className="auth-tabs auth-tabs-three">
            <button className={isLogin && !isAdminLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setIsAdminLogin(false); setMessage('') }}>User Login</button>
            <button className={isAdminLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setIsAdminLogin(true); setMessage('') }}>Admin Login</button>
            <button className={!isLogin && !isAdminLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setIsAdminLogin(false); setMessage('') }}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && !isAdminLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder={isAdminLogin ? 'Enter admin email' : 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={isAdminLogin ? 'Enter admin password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && <div className="message">{message}</div>}

            <button type="submit" className="submit-btn">
              {isAdminLogin ? 'Sign In as Admin →' : isLogin ? 'Sign In to Account →' : 'Create Account →'}
            </button>
          </form>

          <p className="switch-text">
            {isAdminLogin ? 'Admin access is restricted.' : isLogin ? "Don't have an account?" : 'Already have an account?'}
            {!isAdminLogin && <button onClick={() => { setIsLogin(!isLogin); setMessage('') }}>{isLogin ? ' Register' : ' Login'}</button>}
          </p>

          {isAdminLogin && <div className="admin-demo-credentials"><strong>Demo Admin Credentials</strong><span>Email: admin@securebank.com</span><span>Password: Admin@123</span></div>}
          <div className="card-footer">
            🔐 SecureBank Learning Project
          </div>
        </section>
      </main>

      <footer className="footer">
        © 2026 SecureBank. Educational demo only. Not a real banking service.
      </footer>
    </div>
  )
}

export default App
