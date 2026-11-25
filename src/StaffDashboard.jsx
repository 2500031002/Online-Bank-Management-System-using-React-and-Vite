
import { useState } from 'react'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function StaffDashboard({ staff }) {
  const [customers, setCustomers] = useState(() =>
    readJSON('bankUsers', [])
  )

  const [requests, setRequests] = useState(() =>
    readJSON('bankRequests', [])
  )

  const [activeTab, setActiveTab] = useState('Requests')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const refreshCustomers = () => {
    setCustomers(readJSON('bankUsers', []))
  }

  const refreshRequests = () => {
    setRequests(readJSON('bankRequests', []))
  }

  const updateRequestStatus = (id, status) => {
    const updatedRequests = requests.map((request) =>
      request.id === id
        ? {
            ...request,
            status,
            updatedBy: staff.email,
            updatedAt: new Date().toLocaleString(),
          }
        : request
    )

    localStorage.setItem(
      'bankRequests',
      JSON.stringify(updatedRequests)
    )

    setRequests(updatedRequests)
    setMessage('Request status updated successfully.')
  }

  const updateKycStatus = (email, status) => {
    const updatedCustomers = customers.map((customer) =>
      customer.email === email
        ? { ...customer, kycStatus: status }
        : customer
    )

    localStorage.setItem(
      'bankUsers',
      JSON.stringify(updatedCustomers)
    )

    setCustomers(updatedCustomers)
    setMessage('KYC status updated successfully.')
  }

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.accountNumber || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const filteredRequests = requests.filter((request) =>
    `${request.type} ${request.customerName || ''} ${request.email || ''} ${request.details || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const pendingCount = requests.filter(
    (request) => request.status === 'Pending'
  ).length

  const completedCount = requests.filter(
    (request) => request.status === 'Completed'
  ).length

  return (
    <div className="staff-dashboard-content">
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>TOTAL CUSTOMERS</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>PENDING REQUESTS</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>COMPLETED REQUESTS</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <section className="action-card">
        <div className="staff-tabs">
          <button
            className={activeTab === 'Requests' ? 'active' : ''}
            onClick={() => {
              setActiveTab('Requests')
              setMessage('')
              refreshRequests()
            }}
          >
            Customer Requests
          </button>

          <button
            className={activeTab === 'Customers' ? 'active' : ''}
            onClick={() => {
              setActiveTab('Customers')
              setMessage('')
              refreshCustomers()
            }}
          >
            Customer Records
          </button>
        </div>

        {message && (
          <div className="dashboard-message">{message}</div>
        )}

        <input
          className="admin-search"
          type="text"
          placeholder={
            activeTab === 'Requests'
              ? 'Search requests...'
              : 'Search customers...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {activeTab === 'Requests' && (
          <>
            <div className="admin-crud-heading">
              <div>
                <h2>Customer Requests</h2>
                <p>Review and update customer submissions.</p>
              </div>

              <button
                className="admin-cancel-btn"
                onClick={refreshRequests}
              >
                Refresh
              </button>
            </div>

            {filteredRequests.length === 0 ? (
              <p className="empty-history">
                No customer requests found.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Request Type</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.customerName || 'Customer'}</strong>
                          <br />
                          {request.email}
                        </td>

                        <td>{request.type}</td>

                        <td>{request.details || 'No details provided'}</td>

                        <td>{request.createdAt || 'N/A'}</td>

                        <td>
                          <span className="staff-status">
                            {request.status || 'Pending'}
                          </span>
                        </td>

                        <td>
                          <select
                            value={request.status || 'Pending'}
                            onChange={(e) =>
                              updateRequestStatus(
                                request.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'Customers' && (
          <>
            <div className="admin-crud-heading">
              <div>
                <h2>Registered Customers</h2>
                <p>View customer records and manage KYC status.</p>
              </div>

              <button
                className="admin-cancel-btn"
                onClick={refreshCustomers}
              >
                Refresh
              </button>
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="empty-history">
                No customers found.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Account Number</th>
                      <th>KYC Status</th>
                      <th>Update KYC</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.email}>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.accountNumber || 'N/A'}</td>
                        <td>
                          {customer.kycStatus || 'Not Submitted'}
                        </td>
                        <td>
                          <select
                            value={customer.kycStatus || 'Not Submitted'}
                            onChange={(e) =>
                              updateKycStatus(
                                customer.email,
                                e.target.value
                              )
                            }
                          >
                            <option value="Not Submitted">
                              Not Submitted
                            </option>
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <p className="demo-notice">
        Staff access is limited to customer records, KYC status,
        and customer requests in this educational demo.
      </p>
    </div>
  )
}

export default StaffDashboard
