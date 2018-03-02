class Contact {
  constructor(obj) {

  }
}

class ContactApp {
  constructor() {    
    this.tags = ['kids', 'work'];
    this.buildTemplates();
    this.getContacts();

    

    $('.add_button').click(this.displayCreateForm.bind(this));
    $('.create_tag').click(this.createTag.bind(this));
    $('#edit').append($('.contact_info').clone(true));
    


    $('#create .submit').click(this.submitCreate.bind(this));
    $('button.cancel').click(this.cancelCreateOrEdit.bind(this));
    // $('#edit .submit').click(this.submitEdit.bind(this));
    // $('#edit .cancel').click(this.cancelEdit.bind(this));
  }

  getContacts() {
    $.ajax({
      url: '/api/contacts',
      dataType: 'json',
      success: this.renderContactsAndTags.bind(this),
    })
  }

  renderContactsAndTags(contactArray) {
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
    console.log(id);
    this.fillValues(id);
    $('#edit').slideDown();
  }

  fillValues(id) {
    const contact = this.contacts.filter(person => person.id == id )[0];
    console.log(contact);
    $('#edit .info').each( (i, field) => {
      let fieldName = field.name;
      console.log(fieldName);
      console.log(contact[fieldName]);
      field.value = contact[fieldName];
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
    const contactInfo = this.contactData();
    $.ajax({
      type: 'POST',
      url: '/api/contacts',
      data: contactInfo,
      success: this.getContacts.bind(this),
    });
    $('#create').slideUp();
  }

  submitEdit(e) {
    e.preventDefault();
    const contactInfo = contactData();
    $.ajax({
      type: 'PUT',
      url: '/api/'
    })
  }

  sanitizeInput(string) {
    return string.trim().replace('>', '&#60;').replace('<', '&#62;');
  }

  cancelCreateOrEdit(e) {
    e.preventDefault();
    $('#create, #edit').slideUp();
  }

  deleteContact(e) {
    e.preventDefault();
    console.log('called deleteContact');
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

