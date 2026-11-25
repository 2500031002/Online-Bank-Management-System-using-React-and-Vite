
import { useState } from 'react'

// Read the registered users from this browser's Local Storage.
function readUsers() {
  try {
    const savedUsers = JSON.parse(
      localStorage.getItem('bankUsers') || '[]'
    )

    if (!Array.isArray(savedUsers)) return []

    const users = [...savedUsers]

    users.forEach((user, index) => {
      if (!user.accountNumber) {
        users[index] = {
          ...user,
          accountNumber: generateAccountNumber(users),
        }
      }
    })

    localStorage.setItem('bankUsers', JSON.stringify(users))
    return users
  } catch {
    return []
  }
}

// Generate a unique SecureBank account number.
function generateAccountNumber(users) {
  let accountNumber

  do {
    accountNumber =
      'SB' + Math.floor(1000000000 + Math.random() * 9000000000)
  } while (
    users.some((user) => user.accountNumber === accountNumber)
  )

  return accountNumber
}

function AdminUserManagement() {
  const [users, setUsers] = useState(() => readUsers())
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmail, setEditingEmail] = useState(null)
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function refreshUsers() {
    const updatedUsers = readUsers()
    setUsers(updatedUsers)
    return updatedUsers
  }

  function resetForm() {
    setName('')
    setEmail('')
    setPassword('')
    setEditingEmail(null)
    setShowForm(false)
  }

  function handleAddClick() {
    resetForm()
    setShowForm(true)
    setMessage('')
  }

  // CREATE and UPDATE
  function handleSaveUser(event) {
    event.preventDefault()
    setMessage('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName || !cleanEmail) {
      setMessage('Please enter the name and email.')
      return
    }

    const latestUsers = readUsers()

    const duplicateEmail = latestUsers.some(
      (user) =>
        user.email.toLowerCase() === cleanEmail &&
        user.email.toLowerCase() !== editingEmail?.toLowerCase()
    )

    if (duplicateEmail) {
      setMessage('This email is already registered.')
      return
    }

    if (!editingEmail && !password.trim()) {
      setMessage('Please enter a password for the new user.')
      return
    }

    if (editingEmail) {
      const oldEmail = editingEmail.toLowerCase()

      const updatedUsers = latestUsers.map((user) => {
        if (user.email.toLowerCase() !== oldEmail) {
          return user
        }

        return {
          ...user,
          name: cleanName,
          email: cleanEmail,
          password: password.trim() || user.password,
        }
      })

      // Move the user's balance and transactions if the email changes.
      if (oldEmail !== cleanEmail) {
        const oldBalanceKey = `balance_${editingEmail}`
        const newBalanceKey = `balance_${cleanEmail}`
        const oldTransactionsKey = `transactions_${editingEmail}`
        const newTransactionsKey = `transactions_${cleanEmail}`

        const savedBalance = localStorage.getItem(oldBalanceKey)
        const savedTransactions = localStorage.getItem(
          oldTransactionsKey
        )

        if (savedBalance !== null) {
          localStorage.setItem(newBalanceKey, savedBalance)
          localStorage.removeItem(oldBalanceKey)
        }

        if (savedTransactions !== null) {
          localStorage.setItem(
            newTransactionsKey,
            savedTransactions
          )
          localStorage.removeItem(oldTransactionsKey)
        }
      }

      localStorage.setItem(
        'bankUsers',
        JSON.stringify(updatedUsers)
      )

      setUsers(updatedUsers)
      resetForm()
      setMessage('User details updated successfully.')
      return
    }

    // CREATE a new user.
    const newUser = {
      name: cleanName,
      email: cleanEmail,
      password: password.trim(),
      accountNumber: generateAccountNumber(latestUsers),
    }

    const updatedUsers = [...latestUsers, newUser]

    localStorage.setItem(
      'bankUsers',
      JSON.stringify(updatedUsers)
    )

    // New demo accounts start with the same default balance
    // used by the existing project.
    localStorage.setItem(`balance_${cleanEmail}`, '10000')
    localStorage.setItem(
      `transactions_${cleanEmail}`,
      JSON.stringify([])
    )

    setUsers(updatedUsers)
    resetForm()
    setMessage('New user account created successfully.')
  }

  // Load a user into the form for UPDATE.
  function handleEditUser(user) {
    setEditingEmail(user.email)
    setName(user.name)
    setEmail(user.email)
    setPassword('')
    setShowForm(true)
    setMessage('')
  }

  // DELETE
  function handleDeleteUser(user) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}'s account?`
    )

    if (!confirmed) return

    const updatedUsers = readUsers().filter(
      (item) => item.email.toLowerCase() !== user.email.toLowerCase()
    )

    localStorage.setItem(
      'bankUsers',
      JSON.stringify(updatedUsers)
    )

    localStorage.removeItem(`balance_${user.email}`)
    localStorage.removeItem(`transactions_${user.email}`)

    setUsers(updatedUsers)
    setMessage('User account deleted.')
  }

  // READ / SEARCH
  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase()

    return (
      user.name.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.accountNumber.toLowerCase().includes(searchText)
    )
  })

  const totalBalance = users.reduce((total, user) => {
    return (
      total +
      Number(localStorage.getItem(`balance_${user.email}`) || 10000)
    )
  }, 0)

  const totalTransactions = users.reduce((total, user) => {
    try {
      const transactions = JSON.parse(
        localStorage.getItem(`transactions_${user.email}`) || '[]'
      )

      return total + transactions.length
    } catch {
      return total
    }
  }, 0)

  return (
    <div>
      <section className="admin-stats">
        <div className="admin-stat-card">
          <span>REGISTERED USERS</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>TOTAL DEMO BALANCE</span>
          <strong>
            ₹{totalBalance.toLocaleString('en-IN', {
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>RECORDED TRANSACTIONS</span>
          <strong>{totalTransactions}</strong>
        </div>
      </section>

      <section className="history-section admin-users-section">
        <div className="admin-crud-heading">
          <div>
            <h2>Manage User Accounts</h2>
            <p>Create, view, edit, and delete demo users.</p>
          </div>

          <button
            type="button"
            className="admin-add-btn"
            onClick={handleAddClick}
          >
            + Add New User
          </button>
        </div>

        <input
          className="admin-search"
          type="text"
          placeholder="Search name, email, or account number..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {message && (
          <div className="dashboard-message">{message}</div>
        )}

        {showForm && (
          <form className="admin-user-form" onSubmit={handleSaveUser}>
            <h3>{editingEmail ? 'Edit User' : 'Create New User'}</h3>

            <label htmlFor="admin-user-name">Full Name</label>
            <input
              id="admin-user-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter full name"
              required
            />

            <label htmlFor="admin-user-email">Email Address</label>
            <input
              id="admin-user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter email address"
              required
            />

            <label htmlFor="admin-user-password">
              {editingEmail
                ? 'New Password (optional)'
                : 'Password'}
            </label>
            <input
              id="admin-user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                editingEmail
                  ? 'Leave blank to keep current password'
                  : 'Enter password'
              }
              required={!editingEmail}
            />

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-save-btn"
              >
                {editingEmail ? 'Save Changes' : 'Create User'}
              </button>

              <button
                type="button"
                className="admin-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {filteredUsers.length === 0 ? (
          <p className="empty-history">
            No matching users found.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Account Number</th>
                  <th>Balance</th>
                  <th>Transactions</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const userBalance = Number(
                    localStorage.getItem(
                      `balance_${user.email}`
                    ) || 10000
                  )

                  let userTransactions = []

                  try {
                    userTransactions = JSON.parse(
                      localStorage.getItem(
                        `transactions_${user.email}`
                      ) || '[]'
                    )
                  } catch {
                    userTransactions = []
                  }

                  return (
                    <tr key={user.email}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.accountNumber}</td>
                      <td>
                        ₹{userBalance.toLocaleString('en-IN')}
                      </td>
                      <td>{userTransactions.length}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-edit-btn"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-delete-btn"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          className="admin-cancel-btn"
          onClick={refreshUsers}
          style={{ marginTop: '14px' }}
        >
          Refresh User List
        </button>

        <p className="demo-notice">
          Educational demo only. User data is stored in this
          browser's Local Storage.
        </p>
      </section>
    </div>
  )
}

export default AdminUserManagement
