(() => {
    // LIVE SEARCH
    'use strict';

    const search     = RDC.getById('search');
    const records    = RDC.getById('records');
    const no_record  = RDC.getById('no-record');
    const prevButton = RDC.getById('prev_page');
    const nextButton = RDC.getById('next_page');
    const toClone    = RDC.getById('to_clone')
    const source     = RDC.getByClass('record-item', toClone);
    const pageItem   = RDC.getByClass('page', toClone);
    const pagination = RDC.getByClass('pagination');
    const marker     = new Mark(records);
    const markerOptions = {
        'exclude': ['.date-added', '.date-updated', '.patient-info'],
        'acrossElements': true,
        'ignorePunctuation': ['.', ',', '(', ')'],
        'className': 'marked'
    }

    const markValues = () =>
    {
        marker.mark(search.value, markerOptions);
    }

    const beginSearch = async() =>
    {
        const value = search.value;
        const searchEndpoint = RDC.getById('search_action').value + '?query=' + value;
        const response = await fetch(searchEndpoint);

        show(no_record);
        setText(no_record, 'Retrieving...');

        // Clear everything inside
        records.replaceChildren();

        // Clear all existing pages
        RDC.getBySelectorA('.page', pagination).forEach(element => element.remove());

        if (response.ok)
        {
            const output = await response.json();

            hide(no_record);

            if (!output.items.length)
            {
                no_record.textContent = 'No results.';
                show(no_record);
            }
            else
            {
                hide(no_record);

                if (output.has_prev)
                    show(prevButton);
                else
                    hide(prevButton);

                if (output.has_next)
                    show(nextButton);
                else
                    hide(nextButton);

                // Records
                output.items.forEach(current => {
                    const clone = source.cloneNode(true);
                    const fullName = RDC.getByClass('patient-name', clone);
                    const middle_ini = current.middle_initial ? `${current.middle_initial} ` : '';
                    const nickname = current.nickname ? `(${current.nickname})` : '';
                    const year = pluralize('year', current.age);
                    const dateAdded = RDC.getByClass('date-added', clone);
                    const dateUpdated = RDC.getByClass('date-updated', clone);
                    const address = RDC.getByClass('patient-address', clone);

                    clone.href = current.link;
                    fullName.textContent = current.full_name;
                    dateAdded.textContent = `added: ${RDC.formatDateTime(current.created_at)}`;
                    address.textContent = current.address;

                    if (current.updated_at)
                        dateUpdated.textContent = `updated: ${RDC.formatDateTime(current.updated_at)}`;

                    if (isMobile())
                    {
                        hide(dateAdded);
                        hide(dateUpdated);
                    }

                    if (current.age)
                        RDC.getByClass('patient-info', clone).textContent =
                            `${current.age} ${year} old.`;
                    else
                        RDC.getByClass('patient-info', clone).textContent = 'No details';

                    records.appendChild(clone);
                });

                // Mark matches
                markValues();

                // Pagination
                if (output.pages.length > 1)
                {
                    output.pages.forEach((current, index) => {
                        const pageItemClone = pageItem.cloneNode(true);
                        const pageItemLink = pageItemClone.firstElementChild;
                        const thisPage = index + 1;

                        // Modify the link and text
                        pageItemLink.href = current;
                        pageItemLink.textContent = thisPage;

                        if (output.current === thisPage)
                            pageItemLink.classList.add('active');

                        if (output.has_prev)
                            RDC.getByClass('page-link', prevButton).href = output.prev_link;

                        if (output.has_next)
                            RDC.getByClass('page-link', nextButton).href = output.next_link;

                        pagination.insertBefore(pageItemClone, nextButton);
                    });
                }
            }

            return;
        }

        setText(no_record, 'Search failed.');
    };

    if (search) {
        search.addEventListener('input', beginSearch);
        markValues();
    }
})();