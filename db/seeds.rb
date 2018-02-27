require_relative '../lib/todo'

Contact.destroy_all

Contact.create(full_name: 'Naveed Fida', email: 'nf@example.com', phone_number: '12345678901', tags: "work,friends");
Contact.create(full_name: 'Victor Reyes', email: 'vpr@example.com', phone_number: '09876543210', tags: "business")
Contact.create(full_name: 'Pete Hanson', email: 'ph@example.com', phone_number: '54321678901')
