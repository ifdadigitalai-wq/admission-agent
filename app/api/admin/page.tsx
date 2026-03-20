"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
  notes?: string;
  createdAt: string;
};

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
        setLoading(false);
      });
  }, []);

  const updateLead = async (id: string, status: string, notes: string) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, notes } : l))
    );
  };

  if (loading) return <p className="p-8">Loading leads...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard — Leads</h1>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Course</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Notes</th>
            <th className="border p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="border p-2">{lead.name}</td>
              <td className="border p-2">{lead.email}</td>
              <td className="border p-2">{lead.phone}</td>
              <td className="border p-2">{lead.course}</td>
              <td className="border p-2">
                <select
                  value={lead.status}
                  onChange={(e) => updateLead(lead.id, e.target.value, lead.notes || "")}
                  className="border rounded p-1"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </td>
              <td className="border p-2">
                <input
                  defaultValue={lead.notes || ""}
                  onBlur={(e) => updateLead(lead.id, lead.status, e.target.value)}
                  className="border rounded p-1 w-full"
                  placeholder="Add note..."
                />
              </td>
              <td className="border p-2">
                {new Date(lead.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No leads yet.</p>
      )}
    </div>
  );
}