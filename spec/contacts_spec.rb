ENV['RACK_ENV'] = 'test'

require_relative '../contacts'
require 'rspec'
require 'rack/test'

RSpec.describe 'The HelloWorld App' do
  include Rack::Test::Methods

  def app
    ContactsApp
  end

  after do
    Contact.destroy_all
  end

  context 'GET /api/contacts' do
    it 'responds with JSON of all the contacts in the database' do
      ['Naveed Fida', 'Victor Reyes', 'Pete Hanson'].each do |name|
        Contact.create(full_name: name);
      end

      get '/api/contacts'
      expect(last_response).to be_ok
      expect(last_response.body).to eq(Contact.all.to_json)
    end

    it 'responds with JSON of empty array if there are no contacts in the db' do
      get '/api/contacts'
      expect(last_response).to be_ok
      expect(last_response.body).to eq('[]')
    end
  end

  context 'GET /api/contacts/:id' do
    it 'responds with JSON of contact with id == :id if it exists' do
      pete = Contact.create({full_name: 'Pete Hanson'})
      get "/api/contacts/#{pete.id}"
      expect(last_response).to be_ok
      expect(last_response.body).to eq(pete.to_json)
    end

    it 'responds with 404 when contact is not found' do
      get "/api/contacts/4"
      expect(last_response.status).to eq(404)
      expect(last_response.body).to eq("There's no contact with id = 4")
    end
  end

  context 'POST /api/contacts' do
    let(:valid_contact) { { full_name: 'Naveed Fida' } }
    let(:invalid_contact) { { email: 'nf@example.com' } }

    it 'adds a contact to the database when contact is valid' do
      post '/api/contacts', valid_contact
      expect(Contact.count).to eq(1)
    end

    it 'does not add a contact when the contact is invalid' do
      post '/api/contacts', invalid_contact
      expect(Contact.count).to eq(0)
    end

    it 'responds with 400 when the contact is invalid' do
      post '/api/contacts', invalid_contact
      expect(last_response.status).to eq(400)
      expect(last_response.body).to eq('Contact cannot be saved')
    end
  end

  context 'PUT /api/contacts/:id' do
    let(:contact) { Contact.create(full_name: 'Naveed Fida') }
    it 'updates contact when attributes are valid' do
      put "/api/contacts/#{contact.id}", {full_name: 'Pete Hanson'}
      expect(Contact.first.full_name).to eq('Pete Hanson')
    end
  end

  context 'PUT /api/contacts/:id' do
    let(:contact) { Contact.create(full_name: 'Naveed Fida') }
    it 'updates contact when attributes are valid' do
      put "/api/contacts/#{contact.id}", {full_name: 'Pete Hanson'}
      expect(Contact.first.full_name).to eq('Pete Hanson')
    end
  end

  context 'DELETE /api/contacts/:id' do
    before do
      @contact = Contact.create(full_name: 'Naveed Fida')
    end

    it 'deletes contact when id is valid' do
      delete "/api/contacts/#{@contact.id}"
      expect(last_response.status).to eq(204)
      expect(Contact.count).to eq(0)
    end

    it 'sends a 400 when id is valid' do
      delete "/api/contacts/24543523453453"
      expect(last_response.status).to eq(400)
      expect(Contact.count).to eq(1)
    end
  end
end
