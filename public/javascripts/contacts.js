class Contact {
  constructor(obj) {

  }
}

class ContactApp {
  constructor() {
    this.getContacts();
    this.tags = ['kids', 'work'];
    this.buildTemplates();
    this.renderTagOptions();
    this.renderTagCheckboxes();
    // this.renderContacts();

    $('.add_button').click(this.displayCreateForm.bind(this));
    $('.create_tag').click(this.createTag.bind(this));
    $('#edit').append($('.contact_info').clone(true));

    $('#create .submit').click(this.submitCreate.bind(this));
    // $('#create .cancel').click(this.cancelCreate.bind(this));
    // $('#edit .submit').click(this.submitEdit.bind(this));
    // $('#edit .cancel').click(this.cancelEdit.bind(this));
  }

  getContacts() {
    $.ajax({
      url: '/api/contacts',
      dataType: 'json',
      success: (data, status) => {
        this.contacts = data;
        this.renderContacts();
      },
    })
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
  }

  displayCreateForm(e) {
    e.preventDefault();
    console.log('called displayCreateContact')
    $('#create').slideDown();
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
    $(`[value=${tagName}]`).attr('checked', true);
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
    const contact = this.contactData();
    $.ajax({
      type: 'POST',
      url: '/api/contacts',
      data: contact,
      success: function(data, status) {
        console.log(status);
      }
    });
    $('#create').slideUp();
  }

  sanitizeInput(string) {
    return string.trim().replace('>', '&#60;').replace('<', '&#62;');
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

