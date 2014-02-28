<?php
/**
 * @package ImpressPages
 *
 */

namespace Ip\Internal\Pages;





class Helper
{

    public static function pagesGridConfig($parentId)
    {
        return array(
        'table' => 'page',
        'allowCreate' => FALSE,
        'allowSearch' => FALSE,
        'allowDelete' => FALSE,
        'allowUpdate' => FALSE,
        'sortField' => 'pageOrder',
        'pageSize' => ipGetOption('Pages.pageListSize', 30),
        'pageVariableName' => 'gpage',
        'filter' => 'parentId = ' . (int) $parentId, //rename to sqlWhere
        'fields' => array(
            array(
                'label' => __('Title', 'ipAdmin', FALSE),
                'field' => 'title',
            ))
        );
    }


    public static function languageList()
    {
        $answer = array();
        $languages = ipContent()->getLanguages();
        foreach($languages as $language)
        {
            $answer[] = array(
                'id' => $language->getId(),
                'title' => $language->getTitle(),
                'abbreviation' => $language->getAbbreviation(),
                'code' => $language->getCode(),
            );
        }
        return $answer;
    }

    public static function menuForm($menuId)
    {
        $menu = Model::getPage($menuId);

        if (!$menu) {
            throw new \Ip\Exception('Menu not found.', array('id' => $menuId));
        }

        $form = new \Ip\Form();

        $field = new \Ip\Form\Field\Hidden(
            array(
                'name' => 'aa',
                'value' => 'Pages.updateMenu'
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Hidden(
            array(
                'name' => 'id',
                'value' => $menu['id']
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'title',
                'label' => __('Title', 'ipAdmin', false),
                'value' => $menu['title']
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'alias',
                'label' => __('Menu name (used in PHP code)', 'ipAdmin', false),
                'value' => $menu['alias']
            ));
        $form->addField($field);

        $layouts = \Ip\Internal\Design\Service::getLayouts();
        $values = array();
        foreach ($layouts as $layout) {
            $values[] = array($layout, $layout);
        }

        $field = new \Ip\Form\Field\Select(
            array(
                'name' => 'layout',
                'label' => __('Layout', 'ipAdmin', false),
                'value' => ipPageStorage($menu['id'])->get('layout', 'main.php'),
                'values' => $values,
            ));
        $form->addField($field);

        $values = array (
            array ('tree', __('Tree (for menu)', 'ipAdmin', FALSE)),
            array ('list', __('List (for blogs)', 'ipAdmin', FALSE)),
        );
        $field = new \Ip\Form\Field\Select(
            array(
                'name' => 'type',
                'label' => __('Type', 'ipAdmin', false),
                'value' => ipPageStorage($menu['id'])->get('menuType', 'main.php'),
                'values' => $values,
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Submit(
            array(
                'name' => 'submit',
                'value' => __('Save', 'ipAdmin', false)
            ));
        $form->addField($field);

        return $form;
    }

    public static function pagePropertiesForm($pageId)
    {
        $page = new \Ip\Page($pageId);

        $form = new \Ip\Form();

        $field = new \Ip\Form\Field\Hidden(
            array(
                'name' => 'aa',
                'value' => 'Pages.updatePage'
            ));
        $form->addField($field);


        $field = new \Ip\Form\Field\Hidden(
            array(
                'name' => 'pageId',
                'value' => $pageId
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'title',
                'label' => __('Title', 'ipAdmin', false),
                'value' => $page->getTitle()
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'urlPath',
                'label' => __('URL path', 'ipAdmin', false),
                'value' => $page->getUrlPath(),
            ));
        $form->addField($field);


        $field = new \Ip\Form\Field\Checkbox(
            array(
                'name' => 'isVisible',
                'label' => __('Visible', 'ipAdmin', false),
                'value' => $page->isVisible()
            ));
        $form->addField($field);


        $layouts = \Ip\Internal\Design\Service::getLayouts();
        $options = array();
        foreach($layouts as $layout) {
            $options[] = array ($layout, $layout);
        }

        $layout = ipPageStorage($pageId)->get('layout', 'main.php');

        $field = new \Ip\Form\Field\Select(
            array(
                'name' => 'layout',
                'label' => __('Layout', 'ipAdmin', false),
                'values' => $options,
                'value' => $layout
            ));
        $form->addField($field);

        $fieldset = new \Ip\Form\Fieldset(__('Seo', 'ipAdmin', FALSE));
        $fieldset->addAttribute('class', 'ipsFieldsetSeo');
        $form->addFieldset($fieldset);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'metaTitle',
                'label' => __('Meta title', 'ipAdmin', false),
                'value' => $page->getMetaTitle()
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'keywords',
                'label' => __('Keywords', 'ipAdmin', false),
                'value' => $page->getKeywords()
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Textarea(
            array(
                'name' => 'description',
                'label' => __('Description', 'ipAdmin', false),
                'value' => $page->getDescription()
            ));
        $form->addField($field);


        $fieldset = new \Ip\Form\Fieldset(__('Other', 'ipAdmin', FALSE));
        $fieldset->addAttribute('class', 'ipsFieldsetOther');
        $form->addFieldset($fieldset);


        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'createdAt',
                'label' => __('Created on', 'ipAdmin', false),
                'value' => date('Y-m-d', strtotime($page->getCreatedAt()))
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'updatedAt',
                'label' => __('Update on', 'ipAdmin', false),
                'value' => date('Y-m-d', strtotime($page->getUpdatedAt()))
            ));
        $form->addField($field);

        $fieldset = new \Ip\Form\Fieldset();
        $form->addFieldset($fieldset);

        $field = new \Ip\Form\Field\Submit(
            array(
                'name' => 'submit',
                'value' => __('Save', 'ipAdmin', false)
            ));
        $form->addField($field);

        return $form;
    }

    public static function addPageForm()
    {
        $form = new \Ip\Form();

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'title',
                'label' => __('Title', 'ipAdmin', false)
            ));
        $form->addField($field);

        $field = new \Ip\Form\Field\Checkbox(
            array(
                'name' => 'isVisible',
                'label' => __('Visible', 'ipAdmin', false),
                'value' => !ipGetOption('Pages.hideNewPages', 0)
            ));
        $form->addField($field);

        return $form;
    }

    public static function addMenuForm()
    {
        $form = new \Ip\Form();

        $field = new \Ip\Form\Field\Text(
            array(
                'name' => 'title',
                'label' => __('Title', 'ipAdmin', false)
            ));
        $form->addField($field);

        $values = array (
            array ('tree', __('Tree (for menu)', 'ipAdmin', FALSE)),
            array ('list', __('List (for blogs)', 'ipAdmin', FALSE)),
        );
        $field = new \Ip\Form\Field\Select(
            array(
                'name' => 'type',
                'label' => __('Type', 'ipAdmin', false),
                'values' => $values,
            ));
        $form->addField($field);

        return $form;
    }


}
