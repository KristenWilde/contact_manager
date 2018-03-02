class Contact {
  constructor(obj) {

  }
}

class ContactApp {
  constructor() {    
    this.tags;
    this.buildTemplates();
    this.getContacts();

    $('.add_button').click(this.displayCreateForm.bind(this));
    $('button.create_tag').click(this.createTag.bind(this));
    $('#edit').append($('.contact_info').clone(true));
    
    $('button.cancel').click(this.cancelCreateOrEdit.bind(this));
    $('#create form').submit(this.submitCreate.bind(this));
    $('#edit form').submit(this.submitEdit.bind(this));
    $('input').keydown(this.blockCharacters.bind(this));
  }

  blockCharacters(e) {
    const BADCHARS = ['<', '>', "\"", "'", '&'];
    if (BADCHARS.includes(e.key)) {
      e.preventDefault();
    }
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
      return;
    }
    this.contacts = contactArray.map( contact => {
      contact.tags = contact.tags.split(',');
      return contact;
    });
    this.renderContacts();
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

  renderContacts() {
    $('#contact_list').html(this.templates.all_contacts(this.contacts));
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
    let tagName = e.target.previousElementSibling.value;
    tagName = this.sanitizeInput(tagName);
    console.log('new tag:' + tagName)
    if (!this.tags.includes(tagName)) {
      this.tags.push(tagName);
    }
    this.renderTagCheckboxes();
    // $(`[value=${tagName}]`).attr('checked', true);
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
    this.sendAjaxAndRefresh('POST', "", this.contactData())
    $('#create').slideUp();
  }

  sendAjaxAndRefresh(method, id, contactInfo) {
    $.ajax({
      type: method,
      url: id ? '/api/contacts/' + id : 'api/contacts',
      success: this.getContacts.bind(this),
      data: contactInfo,
    })
  }

  submitEdit(e) {
    e.preventDefault();
    const id = e.target.getAttribute('data-id');
    this.sendAjaxAndRefresh('PUT', id, this.contactData())
    $('#edit').slideUp(); 
  }

  sanitizeInput(input) {
    return input.trim();
  }

  cancelCreateOrEdit(e) {
    $('#create, #edit').slideUp();
  }

  deleteContact(e) {
    e.preventDefault();
    const id = e.target.parentNode.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this contact?')) {
      $.ajax({
        type: 'DELETE',
        url: '/api/contacts/' + id,
        success: this.getContacts.bind(this),
      });
    }
  }

  // fillDataObj() {
  //   this.initializeDataObj();
  //   this.$fields.each((idx, el) => {
  //     this.data[el.name] += el.value;
  //   });
  //   return this.data;
  // }
  // }
}

