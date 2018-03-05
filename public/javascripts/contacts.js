class Contact {
  constructor(obj) {

  }
}

class ContactApp {
  constructor() {    
    this.tags = [];
    this.buildTemplates();
    this.getContacts();

    $('.add_button').click(this.displayCreateForm.bind(this));
    $('button.create_tag').click(this.createTag.bind(this));
    $('#edit').append($('.contact_info').clone(true));
    
    $('button.cancel').click(this.cancelCreateOrEdit.bind(this));
    $('#create form').submit(this.submitCreate.bind(this));
    $('#edit form').submit(this.submitEdit.bind(this));
    $('#create input, #edit input').keyup( (event) => {
      this.setErrorMessage(event.target);
    });
    $('#search').keyup(this.search.bind(this));
    $('#taglist').change(this.findByTag.bind(this));
  }

  search(e) {
    const searchString = $('#search').val();
    const matchingContacts = this.contacts.filter((person) => {
      return person.full_name.indexOf(searchString) > -1;
    })
    this.renderContacts(matchingContacts);
    if (matchingContacts.length === 0) {
      const msg = `There are no contacts containing <strong>${searchString}</strong>.`;
      $('#search_msg p').html(msg);
      $('#search_msg').slideDown();
    } else {
      $('#search_msg').slideUp();
    }
  }

  findByTag(e) {
    console.log('findByTag fired.')
    const tag = $('#taglist').val();
    const matchingContacts = this.contacts.filter( person => {
      return person.tags.includes(tag);
    })
    this.renderContacts(matchingContacts);
  }

  getContacts() {
    $.ajax({
      url: '/api/contacts',
      dataType: 'json',
      success: this.renderContactsAndTags.bind(this),
    })
  }

  renderContactsAndTags(contactArray) {
    if (contactArray.length === 0) {
      $('#no_contacts_msg').show();
      this.contacts = [];
    } 
    else { 
      $('#no_contacts_msg').hide();
      this.contacts = contactArray.map( contact => {
        contact.tags = contact.tags.split(',');
        return contact;
      });
    }  
    this.renderContacts(this.contacts);
    this.extractTags();
    this.renderTagOptions();
    this.renderTagCheckboxes();
  }

  extractTags() {
    let tags = [];
    this.contacts.forEach( person => {
      person.tags.forEach( tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    })
    this.tags = tags;
  }

  buildTemplates() {
    this.templates = {};

    $('script[type="text/x-handlebars"]').each((i, script) => {
      let $script = $(script);
      this.templates[$script.attr("id")] = Handlebars.compile($script.html());
    });

    $('[data-type=partial]').each((i, script) => {
      var $partial = $(script);
      Handlebars.registerPartial($partial.attr('id'), $partial.html());
    })
  }

  renderTagOptions() {
    $('.tag_list').html(this.templates.tag_options(this.tags));
  }

  renderTagCheckboxes() {
    $('.tag_checkboxes').html(this.templates.tag_checkboxes(this.tags));
  }

  renderContacts(collection) {
    $('#contact_list').html(this.templates.all_contacts(collection));
    $('button.edit').click(this.displayEditForm.bind(this));
    $('button.delete').click(this.deleteContact.bind(this));
  }

  displayCreateForm(e) {
    e.preventDefault();
    console.log('called displayCreateContact')
    $('#create').slideDown();
  }

  displayEditForm(e) {
    e.preventDefault();
    const id = e.target.parentNode.getAttribute('data-id');
    this.fillValues(id);
    $('#edit form').attr('data-id', id);
    $('#edit').slideDown();
  }

  fillValues(id) {
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

    this.setErrorMessage(field);

    if (field.reportValidity() && !this.tags.includes(tagName)) {
      const $el = $(this.templates.single_checkbox(tagName));
      $el.find(':checkbox').attr('checked', true);
      $('.tag_checkboxes:visible').append($el);
      field.value = "";
    }
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

  contactData() {
    const contact={ 'tags': [] }
    $('form:visible').find('input[name]').each((i, el) => {
      if (el.name == 'tag') {
        if (el.checked) {
          contact['tags'].push(el.value);
        }
      }
      else {
        let val = el.value || "";
        contact[el.name] = (this.sanitizeInput(val))
      }
    })
    contact['tags'] = contact['tags'].join(',');
    return contact
  }

  submitCreate(e) {
    e.preventDefault();
    $('.new_tag').val('');
    $('input:text').each((i, field) => {
      this.setErrorMessage(field);
      console.log(field.name + ' error: ' + field.validationMessage + field.validity.valid);
    }) 
    if (e.target.reportValidity()) {
      this.sendAjaxAndRefresh('POST')
      $('#create').slideUp();
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

  submitEdit(e) {
    e.preventDefault();
    $('.new_tag').val('');
    $('input:text').each((i, field) => {
      this.setErrorMessage(field);
      console.log(field.name + ' error: ' + field.validationMessage + field.validity.valid);
    }) 
    if (e.target.reportValidity()) {
      const id = e.target.getAttribute('data-id');
      this.sendAjaxAndRefresh('PUT', id);
      $('#edit').slideUp(); 
    }
  }

  sanitizeInput(input) {
    return input.trim();
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
}

