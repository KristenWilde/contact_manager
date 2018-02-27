require 'sinatra/base'
require 'sinatra/contrib'
require 'docdsl'
require 'sinatra/activerecord'
require_relative 'lib/contacts'

class ContactsApp < Sinatra::Base
  register Sinatra::Contrib
  register Sinatra::DocDsl

  set :database_file, "config/database.yml"

  after do
    ActiveRecord::Base.clear_active_connections!
  end

  get '/' do
    send_file File.expand_path('index.html', settings.public_folder)
  end

  namespace '/api' do
    helpers do
      def extract_contact_params
        contact_params = [:full_name, :email, :phone_number, :tags]
        params.select { |key, _| contact_params.include?(key.to_sym) }
      end
    end
    documentation 'Retreive all contacts.' do
      puts self
      response 'JSON: all contacts.',
        [
          {
            id: 101,
            full_name: 'Naveed Fida',
            email: 'nf@example.com',
            phone_number: '12345678901',
            tags: "work,friends"},
          {
            id: 102,
            full_name: 'Victor Reyes',
            email: 'vpr@example.com',
            phone_number: '09876543210',
            tags: "business"
          },
          {
            id: 103,
            full_name: 'Pete Hanson',
            email: 'ph@example.com',
            phone_number: '54321678901'
          }
        ]
    end
    get '/contacts' do
      json Contact.all
    end

    documentation 'Retrieves contact with id = {id}' do
      param :id, 'The id of the requested contact.'
      response 'JSON: the contact',
        {
          id: 101,
          full_name: 'Naveed Fida',
          email: 'nf@example.com',
          phone_number: '12345678901',
          tags: "work,friends"
        }
      status 200, 'When contact with id = {id} is found.'
      status 404, 'When contact is not found. Body: "There is no contact with id = {id}"'
    end
    get '/contacts/:id' do
      contact = Contact.find_by(id: params[:id])
      if contact
        json contact
      else
        halt 404, "There's no contact with id = #{params[:id]}"
      end
    end

    documentation 'Saves a new contact.' do
      payload "Request body can be either json or a query string",
        {
          full_name: 'String (Required) : The name of the contact.',
          phone_number: 'String : Th phone number of the contact',
          email: 'String : Email of the contact',
          tags: 'String : comma delimited list of tags. e.g. "work,friend"',
        }
      response 'JSON: The newly created contact with an added id attribute',
        {
          id: 101,
          full_name: 'Naveed Fida',
          email: 'nf@example.com',
          phone_number: '12345678901',
          tags: "work,friends"
        }
      status 201, 'When the contact is saved'
      status 400, 'When contact cannot be saved (due to incorrect attributes). Body: "Contact cannot be saved"'
    end
    post '/contacts' do
      contact_attrs = extract_contact_params
      contact_attrs[:completed] ||= false
      new_contact = Contact.new(extract_contact_params)
      if new_contact.save
        status 201
        json new_contact
      else
        halt 400, 'Contact cannot be saved'
      end
    end

    documentation 'Updates a contact. Uses sent data to set attributes of the contact. If a key/value pair is not present, its previous value is preserved' do
      payload "Request body can be either json or a query string",
        {
          full_name: 'String : Name of the contact.',
          phone_number: 'String : Th phone number of the contact',
          email: 'String : Email of the contact',
          tags: 'String : comma delimited list of tags. e.g. "work,friend"',
        }
      response 'JSON: The updated contact'
      status 201, 'When contact is saved'
      status 400, 'When contact cannot be saved. Body: "Contact cannot be updated."'
    end
    put '/contacts/:id' do
      contact = Contact.find_by(id: params[:id])

      if contact.update(extract_contact_params)
        status 201
        json contact
      else
        halt 400, 'Contact cannot be updated'
      end
    end

    documentation 'Deletes a contact' do
      status 204, '204 with no body when contact is deleted'
      status 400, 'When contact with id = {id} does not exist. Body: "Contact does not exist"'
    end
    delete '/contacts/:id' do
      contact = Contact.find_by(id: params[:id])
      if contact.nil?
        halt 400, 'Contact does not exist'
      else
        contact.destroy
        halt 204
      end
    end
  end

  doc_endpoint '/doc'
  run! if app_file == $0
end
