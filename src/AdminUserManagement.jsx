
import { useState } from 'react'

function readStaff() {
  try {
    return JSON.parse(localStorage.getItem('bankStaff')) || []
  } catch {
    return []
  }
}

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback
  } catch {
    return fallback
  }
}

function AdminUserManagement() {
  const [staff, setStaff] = useState(readStaff)
  const [customers] = useState(() => readJSON('bankUsers', []))
  const [requests] = useState(() => readJSON('bankRequests', []))

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmail, setEditingEmail] = useState(null)
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const refreshStaff = () => {
    setStaff(readStaff())
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setEditingEmail(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
    setMessage('')
  }

  const handleSave = (e) => {
    e.preventDefault()
    setMessage('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName || !cleanEmail) {
      setMessage('Please enter the staff name and email.')
      return
    }

    if (!editingEmail && !password.trim()) {
      setMessage('Please enter a password for the new staff account.')
      return
    }

    const duplicate = staff.some(
      (person) =>
        person.email.toLowerCase() === cleanEmail &&
        person.email !== editingEmail
    )

    if (duplicate) {
      setMessage('A staff account with this email already exists.')
      return
    }

    const customerEmailExists = readJSON('bankUsers', []).some(
      (person) => person.email.toLowerCase() === cleanEmail
    )

    if (customerEmailExists) {
      setMessage('This email is already registered as a customer.')
      return
    }

    let updatedStaff

    if (editingEmail) {
      updatedStaff = staff.map((person) =>
        person.email === editingEmail
          ? {
              ...person,
              name: cleanName,
              email: cleanEmail,
              ...(password.trim() ? { password } : {}),
            }
          : person
      )
    } else {
      const newStaff = {
        id: `ST${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password,
        role: 'Staff',
      }

      updatedStaff = [...staff, newStaff]
    }

    localStorage.setItem('bankStaff', JSON.stringify(updatedStaff))
    setStaff(updatedStaff)
    setMessage(
      editingEmail
        ? 'Staff account updated successfully.'
        : 'Staff account created successfully.'
    )
    resetForm()
  }

  const handleEdit = (person) => {
    setName(person.name)
    setEmail(person.email)
    setPassword('')
    setEditingEmail(person.email)
    setShowForm(true)
    setMessage('')
  }

  const handleDelete = (person) => {
    const confirmed = window.confirm(
      `Delete the staff account for ${person.name}?`
    )

    if (!confirmed) return

    const updatedStaff = staff.filter(
      (item) => item.email !== person.email
    )

    localStorage.setItem('bankStaff', JSON.stringify(updatedStaff))
    setStaff(updatedStaff)
    setMessage('Staff account deleted successfully.')
  }

  const filteredStaff = staff.filter((person) =>
    `${person.name} ${person.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const totalBalance = customers.reduce((total, customer) => {
    return (
      total +
      Number(localStorage.getItem(`balance_${customer.email}`) || 10000)
    )
  }, 0)

  const totalTransactions = customers.reduce((total, customer) => {
    return (
      total +
      readJSON(`transactions_${customer.email}`, []).length
    )
  }, 0)

  const pendingRequests = requests.filter(
    (request) => !request.status || request.status === 'Pending'
  ).length

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>TOTAL STAFF</span>
          <strong>{staff.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>TOTAL CUSTOMERS</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>PENDING REQUESTS</span>
          <strong>{pendingRequests}</strong>
        </div>

        <div className="admin-stat-card">
          <span>TOTAL DEMO BALANCE</span>
          <strong>
            ₹{totalBalance.toLocaleString('en-IN')}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>TOTAL TRANSACTIONS</span>
          <strong>{totalTransactions}</strong>
        </div>
      </div>

      <section className="history-section admin-users-section">
        <div className="admin-crud-heading">
          <div>
            <h2>Staff Management</h2>
            <p>Create, update and manage SecureBank staff accounts.</p>
          </div>

          <button className="admin-add-btn" onClick={handleAdd}>
            + Add Staff
          </button>
        </div>

        {message && (
          <div className="dashboard-message">{message}</div>
        )}

        {showForm && (
          <form className="admin-user-form" onSubmit={handleSave}>
            <h3>
              {editingEmail ? 'Edit Staff Account' : 'Create Staff Account'}
            </h3>

            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter staff name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter staff email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>
              {editingEmail
                ? 'New Password (leave blank to keep current password)'
                : 'Password'}
            </label>

            <input
              type="password"
              placeholder="Enter staff password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingEmail}
            />

            <div className="admin-form-actions">
              <button type="submit" className="admin-save-btn">
                {editingEmail ? 'Update Staff' : 'Create Staff'}
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

        <input
          className="admin-search"
          type="text"
          placeholder="Search staff by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.map((person) => (
                <tr key={person.email}>
                  <td>{person.id}</td>
                  <td>{person.name}</td>
                  <td>{person.email}</td>
                  <td>{person.role || 'Staff'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-edit-btn"
                        onClick={() => handleEdit(person)}
                      >
                        Edit
                      </button>

                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDelete(person)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan="5">No staff accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="history-section admin-users-section">
        <div className="admin-crud-heading">
          <div>
            <h2>Registered Customers</h2>
            <p>View customer accounts and overall banking activity.</p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Account Number</th>
                <th>Balance</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => {
                const customerBalance = Number(
                  localStorage.getItem(`balance_${customer.email}`) || 10000
                )

                return (
                  <tr key={customer.email}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.accountNumber || 'N/A'}</td>
                    <td>
                      ₹{customerBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })}

              {customers.length === 0 && (
                <tr>
                  <td colSpan="4">No registered customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default AdminUserManagement
