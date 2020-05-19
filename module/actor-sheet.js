/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ZweihanderActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "actor"],
      template: "systems/zweihander/templates/actor-sheet.html",
      width: 720,
      height: 945,
      resizable: false,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    if (this.actor.data.type === "character") {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    const weapons = [];
    const armor = [];
    const ancestry = [];
    const spells = [];

    for (let item of actorData.items) {
      if (item.type === "weapon")
        weapons.push(item);
      else if (item.type === "ancestry")
        ancestry.push(item);
      else if (item.type === "armor")
        armor.push(item);
      else if (item.type === "spell")
        spells.push(item);
    }

    actorData.weapons = weapons;
    actorData.ancestry = ancestry;
    actorData.armor = armor;
    actorData.spells = spells;

    // for (let armor of actorData.armor) {
    //   if (armor.data.equipped)
    //     this._prepareDamageThreshold(armor, actorData);
    // }
  }

  _prepareDamageThreshold(armor, actorData) {
    const data = actorData.data;
    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    for (let i = 0; i < damageArray.length; i++)
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] += armor.data.damageThresholdModifier.value;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const actorData = this.actor.data;

    // Everything below here is only needed if the sheet is editable

    if (!this.options.editable) return;


    // Update/Edit Inventory Item

    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });


    // Delete Inventory Item

    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // toFormat.replace(/(@([a-zA-Z0-9]\.)*[a-zA-Z0-9]+)/g, (key) => resolveProperty(actorData, key))

    html.find('.spell-duration').each(function() {
      const toFormat = $(this).text();

      if (toFormat[0] === "@") {
        const contents = toFormat.split("+");
        const key = contents[0].replace("@", "data.");
        const bonus = getProperty(actorData, key);
        const setDuration = contents[1].split(' ');
        
        $(this).text((bonus + Number(setDuration[0])) + " " + setDuration[1]);
      }
    });


    // Add or Remove Attribute
    //html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));


    // On loss of focus, update the textbox value

    html.find(".notepad").focusout(event => {
      this.actor.update({ "data.flavor.notes": event.target.value });
    });

    this._setEncumbranceMeter(html);
  }

  _formatDuration(textToFormat) {
    let formattedText = "";

    const contents = textToFormat;

    console.log(contents);
  }

  _setEncumbranceMeter(html) {
    const currentEncumbrance = html.find(".encumbrance-current").val();
    const totalEncumbrance = html.find(".encumbrance-total").val();
    const ratio = (currentEncumbrance / totalEncumbrance) * 100;

    html.find(".meter-value").width(ratio + "%");
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  async _onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    const attrs = this.object.data.data.attributes;
    const form = this.form;

    // Add new attribute
    if (action === "create") {
      const nk = Object.keys(attrs).length + 1;
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await this._onSubmit(event);
    }

    // Remove existing attribute
    else if (action === "delete") {
      const li = a.closest(".attribute");
      li.parentElement.removeChild(li);
      await this._onSubmit(event);
    }
  }


  async _render(force = false, options = {}) {
    this._saveScrollPos();

    await super._render(force, options);

    this._setScrollPos();
  }

  _saveScrollPos() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.scrollPos = [];

    let lists = $(html.find(".save-scroll"));

    for (let list of lists) {
      this.scrollPos.push($(list).scrollTop());
    }
  }

  _setScrollPos() {
    if (this.scrollPos) {
      const html = $(this.form).parent();

      let lists = $(html.find(".save-scroll"));

      for (let i = 0; i < lists.length; i++) {
        $(lists[i]).scrollTop(this.scrollPos[i]);
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // Handle the free-form attributes list
    console.log("TEST formData :::: ", formData);
    console.log("TEST expandObject(formData) :::: ", expandObject(formData));
    console.log("TEST expandObject(formData).data :::: ", expandObject(formData).data);
    /*const formAttrs = expandObject(formData).data.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});
    
    // Remove attributes which are no longer used
    for ( let k of Object.keys(this.object.data.data.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: this.object._id, "data.attributes": attributes});
    */
    // Update the Actor
    return this.object.update(formData);
  }
}
