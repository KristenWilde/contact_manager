class ContactApp {
  constructor() {    
    this.tags = [];
    this.buildTemplates();
    this.getContacts();

    $('.add_button').click(this.displayCreateForm.bind(this));
    $('button.create_tag').click(this.createTag.bind(this));
    $('button.cancel').click(this.cancelCreateOrEdit.bind(this));
    $('#edit').append($('.contact_info').clone(true));
    
    $('#create form').submit(this.submitCreate.bind(this));
    $('#edit form').submit(this.submitEdit.bind(this));
    $('#create input, #edit input').keyup( (event) => {
      this.setErrorMessage(event.target);
    });
    $('#search').keyup(this.search.bind(this));
    $('#taglist').change(this.findByTag.bind(this));
  }

  buildTemplates() {
    this.templates = {};

    $('script[type="text/x-handlebars"]').each((i, template) => {
      this.templates[template.id] = Handlebars.compile(template.innerHTML);
    });

    $('[data-type=partial]').each((i, partial) => {
      Handlebars.registerPartial(partial.id, partial.innerHTML);
    })
  }

  getContacts() {
    $.ajax({
      url: '/api/contacts',
      dataType: 'json',
      success: this.renderContactsAndTags.bind(this),
    })
  }

  renderContactsAndTags(json) {
    if (json.length === 0) {
      $('#no_contacts_msg').show();
      this.contacts = [];
    } 
    else { 
      $('#no_contacts_msg').hide();
      this.contacts = json.map( contact => {
        contact.tags = contact.tags.split(',');
        return contact;
      });
    }  
    this.renderContacts(this.contacts);
    this.extractTags();
    this.renderTagOptions();
    this.renderTagCheckboxes();
  }

  renderContacts(collection) {
    $('#contact_list').html(this.templates.contactsCollection(collection));
    $('button.edit').click(this.displayEditForm.bind(this));
    $('button.delete').click(this.deleteContact.bind(this));
  }

  extractTags() {
    const tags = [];
    this.contacts.forEach( person => {
      person.tags.forEach( tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    })
    this.tags = tags;
  }

  renderTagOptions() {
    $('#current_tags').html(this.templates.tagOptions(this.tags));
  }

  renderTagCheckboxes() {
    $('.tag_checkboxes').html(this.templates.tagCheckboxes(this.tags));
  }

  displayCreateForm(e) {
    e.preventDefault();
    $('#create').slideDown();
  }

  displayEditForm(e) {
    e.preventDefault();
    const id = e.target.parentNode.getAttribute('data-id');

    this.fillValuesToEdit(id);
    $('#edit form').attr('data-id', id);
    $('#edit').slideDown();
  }

  fillValuesToEdit(id) {
    const contact = this.contacts.filter(person => person.id == id )[0];

    $('#edit .info').each( (i, field) => {
      field.value = contact[field.name];
    });

    $('#edit [name=tag]').each( (i, checkbox) => {
      if (contact.tags.includes(checkbox.value)) {
        checkbox.setAttribute('checked', true);
      }
    })
  }

  createTag(e) {
    e.preventDefault();
    const field = e.target.previousElementSibling;
    const tagName = field.value.trim();

    if (this.validateNewTag(tagName, field)) {
      const $newTag = $(this.templates.singleCheckbox(tagName));

      $newTag.find(':checkbox').attr('checked', true);
      $('.tag_checkboxes:visible').append($newTag);
      field.value = "";
    }
  }

  validateNewTag(tagName, field) {
    this.setErrorMessage(field);
    return !!tagName && !this.tags.includes(tagName) && field.reportValidity();
  }

  submitCreate(e) {
    e.preventDefault();
    const form = e.target
    if (this.validateContactData(form)) {
      this.sendAjaxAndRefresh('POST')
      $('#create').slideUp();
    }
  }

  submitEdit(e) {
    e.preventDefault();
    const form = e.target;
    if (this.validateContactData(form)) {
      const id = form.getAttribute('data-id');
      this.sendAjaxAndRefresh('PUT', id);
      $('#edit').slideUp(); 
    }
  }

  validateContactData(form) {
    $('.new_tag').val('');
    $(form).find('input:text').each((i, field) => {
      this.setErrorMessage(field);
    }) 
    return form.reportValidity();
  }

  setErrorMessage(field) {
    if (field.validity.valueMissing) {
      field.setCustomValidity('Name is required.')
    }
    else if (field.validity.patternMismatch) {
      field.setCustomValidity("Characters not allowed: <>'/\"&");
    } 
    else {
      field.setCustomValidity('');
    }
  }

  sendAjaxAndRefresh(method, id) {
    $.ajax({
      type: method,
      url: id ? '/api/contacts/' + id : 'api/contacts',
      success: this.getContacts.bind(this),
      data: (method === 'PUT' || method === 'POST') ? this.contactData() : null,
      dataType: (method === 'GET') ? 'json' : null,
    })
  } 

  contactData() {
    const contact = { 'tags': [] }
    $('form:visible').find('input[name]').each((i, input) => {
      if (input.name === 'tag' && input.checked) {
        contact['tags'].push(input.value);
      }
      else {
        contact[input.name] = input.value.trim() || "";
      }
    })
    contact['tags'] = contact['tags'].join(',');
    return contact
  }

  cancelCreateOrEdit(e) {
    // Don't prevent default behavior - form should reset.
    $('#create, #edit').slideUp();
  }

  deleteContact(e) {
    e.preventDefault();
    const id = e.target.parentNode.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this contact?')) {
      this.sendAjaxAndRefresh('DELETE', id);
    }
  }

  search(e) {
    const searchString = $('#search').val().toLowerCase();
    const matchingContacts = this.contacts.filter((person) => {
      return person.full_name.toLowerCase().includes(searchString);
    })
    this.renderContacts(matchingContacts);

    if (matchingContacts.length === 0) {
      const msg = `There are no contacts containing <strong>${searchString}</strong>.`;
      $('#search_msg p').html(msg);
      $('#search_msg').slideDown();
    } else {
      $('#search_msg').slideUp();
    }
    $('#taglist').val('All tags');
  }

  findByTag(e) {
    const tag = $('#taglist').val();
    let matchingContacts;
    if (tag === 'All tags') {
      matchingContacts = this.contacts;
    }
    else {
      matchingContacts = this.contacts.filter( person => {
        return person.tags.includes(tag);
      })
    }
    this.renderContacts(matchingContacts);
    $('#search').val('');
  }
}

